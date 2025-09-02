const SiteSetting = require("../../models/siteSetting");

const KEY_SHORTS = "homeShortsVideoId";

class SettingsController {
  static async getShortsVideoId(req, res) {
    try {
      const doc = await SiteSetting.findOne({ key: KEY_SHORTS }).lean();
      const raw = (doc?.value || "").trim();
      // Stored as CSV string; split into list
      const list = raw
        ? raw
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];
      // Compute rotating current ID (every 3 hours)
      const bucket = Math.floor(Date.now() / (3 * 60 * 60 * 1000));
      const value = list.length ? list[bucket % list.length] : "";
      return res.status(200).json({ success: true, key: KEY_SHORTS, value, list });
    } catch (err) {
      console.error("getShortsVideoId error", err);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  }

  static async updateShortsVideoId(req, res) {
    try {
      const { value } = req.body || {};

      // Accept either a string (single ID or CSV) or an array of IDs
      let toStore = "";

      // Basic ID sanitizer: allow typical YouTube ID charset
      const sanitizeId = (v) => {
        if (typeof v !== "string") return "";
        const trimmed = v.trim();
        const match = trimmed.match(/[A-Za-z0-9_-]{6,}/);
        return match ? match[0] : "";
      };

      if (Array.isArray(value)) {
        const cleaned = value.map(sanitizeId).filter(Boolean);
        toStore = cleaned.join(",");
      } else if (typeof value === "string") {
        // If a URL or CSV string is provided, try to extract IDs
        // Split by commas/newlines and sanitize
        const parts = value
          .split(/[,\n]/)
          .map((p) => sanitizeId(p))
          .filter(Boolean);
        toStore = parts.join(",");
      } else {
        return res.status(400).json({ success: false, message: "Value must be a string or array" });
      }

      const updated = await SiteSetting.findOneAndUpdate(
        { key: KEY_SHORTS },
        { $set: { value: toStore, updatedBy: req?.user?.email || req?.user?._id || "admin" } },
        { new: true, upsert: true }
      ).lean();

      // Respond with computed list and current rotating value for convenience
      const list = toStore ? toStore.split(",").filter(Boolean) : [];
      const bucket = Math.floor(Date.now() / (3 * 60 * 60 * 1000));
      const current = list.length ? list[bucket % list.length] : "";

      return res.status(200).json({ success: true, key: KEY_SHORTS, value: current, list });
    } catch (err) {
      console.error("updateShortsVideoId error", err);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
}

module.exports = SettingsController;
