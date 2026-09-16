const asyncHandler = require("../utils/asyncHandler");
const CrmBrand = require("../model/crmBrand");
const CrmDeal = require("../model/crmDeal");

function getUserId(req) {
  return req.user?.id || req.user?._id;
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const addSponsorshipRecommendationToCrm = asyncHandler(async (req, res) => {
  const creatorId = getUserId(req);
  const {
    recommendationId,
    brand,
    category,
    contactName,
    contactEmail,
    budget,
    niche,
  } = req.body || {};

  if (!creatorId) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  if (!recommendationId || typeof recommendationId !== "string") {
    return res.status(400).json({
      success: false,
      message: "Recommendation ID is required",
    });
  }

  const normalizedRecommendationId = recommendationId.trim();
  if (normalizedRecommendationId.length === 0 || normalizedRecommendationId.length > 128) {
    return res.status(400).json({
      success: false,
      message: "Recommendation ID must be between 1 and 128 characters",
    });
  }

  if (!brand || typeof brand !== "string" || brand.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: "Brand name is required",
    });
  }

  const companyName = brand.trim();
  if (companyName.length > 200) {
    return res.status(400).json({
      success: false,
      message: "Brand name is too long",
    });
  }

  const creatorFilter = { creatorId };
  const statusTag = `sponsorship-matchmaker:${normalizedRecommendationId}`;

  let deal = await CrmDeal.findOne({ ...creatorFilter, statusTag });
  if (deal) {
    const existingBrand = deal.brandId
      ? await CrmBrand.findOne({ _id: deal.brandId, ...creatorFilter })
      : await CrmBrand.findOne({
          ...creatorFilter,
          companyName: new RegExp(`^${escapeRegex(companyName)}$`, "i"),
        });

    return res.json({
      success: true,
      alreadyExists: true,
      data: {
        brand: existingBrand,
        deal,
      },
    });
  }

  let crmBrand = await CrmBrand.findOne({
    ...creatorFilter,
    companyName: new RegExp(`^${escapeRegex(companyName)}$`, "i"),
  });

  if (!crmBrand) {
    crmBrand = await CrmBrand.create({
      creatorId,
      companyName,
      category: typeof category === "string" && category.trim() ? category.trim().slice(0, 100) : "Tech",
      contactName: typeof contactName === "string" ? contactName.trim().slice(0, 200) : "",
      contactEmail: typeof contactEmail === "string" ? contactEmail.trim().slice(0, 320) : "",
      status: "lead",
      notes: "Added from Sponsorship Matchmaker.",
      contactHistory: [
        {
          type: "note",
          note: `Recommendation added from Sponsorship Matchmaker${
            niche ? ` for the ${String(niche).trim().slice(0, 100)} niche` : ""
          }.`,
          createdBy: req.user?.name || "Creator",
        },
      ],
    });
  }

  deal = await CrmDeal.create({
    creatorId,
    brandId: crmBrand._id,
    dealName: `${companyName} Sponsorship Outreach`,
    companyName: crmBrand.companyName,
    category: crmBrand.category,
    contactName: crmBrand.contactName,
    contactEmail: crmBrand.contactEmail,
    stage: "outreach",
    amount: 0,
    notes: budget
      ? `Recommendation budget: ${String(budget).trim().slice(0, 200)}.`
      : "Added from Sponsorship Matchmaker.",
    statusTag,
    emailedBadge: false,
  });

  return res.status(201).json({
    success: true,
    alreadyExists: false,
    data: {
      brand: crmBrand,
      deal,
    },
  });
});

module.exports = {
  addSponsorshipRecommendationToCrm,
};
