const CrmBrand = require("../../model/crmBrand");
const CrmDeal = require("../../model/crmDeal");
const CrmInvoice = require("../../model/crmInvoice");

describe("CRM ownership fields", () => {
  test.each([
    ["CrmBrand", CrmBrand],
    ["CrmDeal", CrmDeal],
    ["CrmInvoice", CrmInvoice],
  ])("%s keeps creatorId immutable", (_name, Model) => {
    expect(Model.schema.path("creatorId").options.immutable).toBe(true);
  });
});
