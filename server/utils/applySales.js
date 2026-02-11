import Sale from '../models/Sale.js';

// In-memory cache for active sales
let cachedSales = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60 * 1000; // 60 seconds

/**
 * Get all currently active sales, cached for 60 seconds.
 */
export const getActiveSales = async () => {
  const now = Date.now();
  if (cachedSales && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedSales;
  }

  const currentDate = new Date();
  cachedSales = await Sale.find({
    isActive: true,
    startDate: { $lte: currentDate },
    endDate: { $gte: currentDate }
  }).sort({ priority: -1 });

  cacheTimestamp = now;
  return cachedSales;
};

/**
 * Find the highest-priority sale applicable to a product.
 */
export const findApplicableSale = (product, activeSales) => {
  const productId = product._id.toString();
  const categoryId = product.category?._id?.toString() || product.category?.toString();

  for (const sale of activeSales) {
    // Check usage limit
    if (sale.usageLimit && sale.usageCount >= sale.usageLimit) {
      continue;
    }

    // Check excluded products
    if (sale.excludedProducts?.length > 0) {
      const excluded = sale.excludedProducts.some(
        ep => ep.toString() === productId
      );
      if (excluded) continue;
    }

    // Check applicability
    if (sale.applicableTo === 'all') {
      return sale;
    }

    if (sale.applicableTo === 'categories' && categoryId) {
      const matches = sale.categories?.some(
        c => c.toString() === categoryId
      );
      if (matches) return sale;
    }

    if (sale.applicableTo === 'products') {
      const matches = sale.products?.some(
        p => p.toString() === productId
      );
      if (matches) return sale;
    }
  }

  return null;
};

/**
 * Calculate discounted price given original price and a sale.
 */
export const calculateDiscountedPrice = (price, sale) => {
  if (!sale || !price || price <= 0) return price;

  let discountedPrice;

  if (sale.type === 'percentage') {
    let discount = (price * sale.discountValue) / 100;
    if (sale.maxDiscount && discount > sale.maxDiscount) {
      discount = sale.maxDiscount;
    }
    discountedPrice = price - discount;
  } else if (sale.type === 'fixed') {
    discountedPrice = price - sale.discountValue;
  } else {
    // buy_get type - not applied at product level
    return price;
  }

  return Math.max(0, Math.round(discountedPrice));
};

/**
 * Apply active sales to an array of products.
 * Sets salePrice and activeSale metadata on each product.
 * When both manual salePrice and dynamic sale exist, the lower price wins.
 */
export const applySalesToProducts = async (products) => {
  if (!products || products.length === 0) return products;

  const activeSales = await getActiveSales();
  if (activeSales.length === 0) return products;

  return products.map(product => {
    const productObj = product.toObject ? product.toObject() : { ...product };
    return applyDynamicSale(productObj, activeSales);
  });
};

/**
 * Apply sale to a single product.
 */
export const applySaleToSingleProduct = async (product) => {
  if (!product) return product;

  const activeSales = await getActiveSales();
  if (activeSales.length === 0) return product;

  const productObj = product.toObject ? product.toObject() : { ...product };
  return applyDynamicSale(productObj, activeSales);
};

/**
 * Get effective price for a product + ageRange combination.
 * Used by cart/order controllers for authoritative server-side pricing.
 */
export const getEffectivePrice = async (product, ageRange) => {
  const activeSales = await getActiveSales();
  const sale = findApplicableSale(product, activeSales);

  // Get base price for age range
  let basePrice = product.price;
  let manualSalePrice = product.salePrice;

  if (product.agePricing?.length > 0 && ageRange) {
    const agePriceData = product.agePricing.find(ap => ap.ageRange === ageRange);
    if (agePriceData) {
      basePrice = agePriceData.price;
      manualSalePrice = agePriceData.salePrice;
    }
  }

  // Calculate dynamic sale price
  let dynamicPrice = sale ? calculateDiscountedPrice(basePrice, sale) : null;

  // Determine final price: lowest of manual salePrice and dynamic price
  const candidates = [basePrice];
  if (manualSalePrice && manualSalePrice > 0 && manualSalePrice < basePrice) {
    candidates.push(manualSalePrice);
  }
  if (dynamicPrice !== null && dynamicPrice < basePrice) {
    candidates.push(dynamicPrice);
  }

  return Math.min(...candidates);
};

/**
 * Internal helper: apply dynamic sale to a plain product object.
 */
function applyDynamicSale(productObj, activeSales) {
  const sale = findApplicableSale(productObj, activeSales);
  if (!sale) return productObj;

  // Apply to main price
  const dynamicMainPrice = calculateDiscountedPrice(productObj.price, sale);

  // Determine winning main salePrice
  const manualMain = productObj.salePrice;
  if (manualMain && manualMain > 0 && manualMain < productObj.price) {
    // Both exist - lowest wins
    productObj.salePrice = Math.min(manualMain, dynamicMainPrice);
  } else {
    productObj.salePrice = dynamicMainPrice;
  }

  // Apply to agePricing entries
  if (productObj.agePricing?.length > 0) {
    productObj.agePricing = productObj.agePricing.map(ap => {
      const dynamicAgePrice = calculateDiscountedPrice(ap.price, sale);
      const manualAge = ap.salePrice;

      if (manualAge && manualAge > 0 && manualAge < ap.price) {
        ap.salePrice = Math.min(manualAge, dynamicAgePrice);
      } else {
        ap.salePrice = dynamicAgePrice;
      }
      return ap;
    });
  }

  // Attach sale metadata
  productObj.activeSale = {
    saleName: sale.name,
    type: sale.type,
    discountValue: sale.discountValue,
    endDate: sale.endDate
  };

  return productObj;
}
