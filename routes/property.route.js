const express = require("express");
const router = express.Router();
const upload = require("../aws/multerConfig");
const BuyController = require("../Controller/AdminController/FrontController/BuyController");
const rentController = require("../Controller/AdminController/FrontController/RentController");

router.post(
  "/buyInsert",
  upload.fields([
    { name: "frontImage", maxCount: 1 },
    { name: "otherImage", maxCount: 20 },
  ]),
  BuyController.buycommercialInsert,
);
// router.get('/buy/:type', BuyController.buycommercialView)
// router.get('/buy/:projectName/:type', BuyController.view_Name_type)
router.get("/buy/ViewAll", BuyController.viewAll);
router.get("/view/:id", BuyController.buyView_id);
router.get("/buy/edit/:id", BuyController.buycommercialEdit);
router.post(
  "/buy/update/:id",
  upload.fields([
    { name: "frontImage", maxCount: 1 },
    { name: "otherImage", maxCount: 20 },
  ]),
  BuyController.buycommercialUpdate,
);
router.delete("/buy/delete/:id", BuyController.buycommercialDelete);
//rent
router.post(
  "/rentInsert",
  upload.fields([
    { name: "frontImage", maxCount: 1 },
    { name: "otherImage", maxCount: 20 },
  ]),
  rentController.rentInsert,
);
router.get("/:id/rentedit", rentController.rentEdit);
router.get("/:type/rentView", rentController.rentView);
router.get("/rent/viewall", rentController.rentViewAll);
router.get("/rent/:id", rentController.rentView_id);
router.post(
  "/:id/rentUpdate",
  upload.fields([
    { name: "frontImage", maxCount: 1 },
    { name: "otherImage", maxCount: 20 },
  ]),
  rentController.rentUpdate,
);
router.delete("/:id/rentDelete", rentController.rentDelete);

module.exports = router;
