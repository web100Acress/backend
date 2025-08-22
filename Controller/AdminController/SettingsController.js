const SiteSetting = require("../../models/siteSetting");

const KEY_SHORTS = "homeShortsVideoId";

class SettingsController {
  static async getShortsVideoId(req, res) {
    try {
      const doc = await SiteSetting.findOne({ key: KEY_SHORTS }).lean();
      const value = doc?.value || "";
      return res.status(200).json({ success: true, key: KEY_SHORTS, value });
    } catch (err) {
      console.error("getShortsVideoId error", err);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  }

  static async updateShortsVideoId(req, res) {
    try {
      const { value } = req.body || {};
      if (typeof value !== "string") {
        return res.status(400).json({ success: false, message: "Value must be a string" });
      }
      const updated = await SiteSetting.findOneAndUpdate(
        { key: KEY_SHORTS },
        { $set: { value, updatedBy: req?.user?.email || req?.user?._id || "admin" } },
        { new: true, upsert: true }
      ).lean();
      return res.status(200).json({ success: true, key: KEY_SHORTS, value: updated.value });
    } catch (err) {
      console.error("updateShortsVideoId error", err);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
}

module.exports = SettingsController;
