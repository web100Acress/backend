const fs = require('fs').promises;
const path = require('path');
const xml2js = require('xml2js');

// Configurable sitemap path with better defaults
const DEFAULT_SITEMAP_PATH = path.join(process.cwd(), 'public', 'sitemap.xml');
const SITEMAP_PATH = process.env.SITEMAP_FILE || DEFAULT_SITEMAP_PATH;

// Create public directory if it doesn't exist
const ensurePublicDir = async () => {
  const publicDir = path.dirname(SITEMAP_PATH);
  try {
    await fs.mkdir(publicDir, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') {
      console.error('Error creating public directory:', err);
    }
  }
};

// Initialize the sitemap file if it doesn't exist
const initializeSitemap = async () => {
  try {
    await fs.access(SITEMAP_PATH);
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log('Sitemap not found, creating a new one at:', SITEMAP_PATH);
      const initialSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`;
      await ensurePublicDir();
      await fs.writeFile(SITEMAP_PATH, initialSitemap, 'utf8');
    }
  }
};

// Initialize sitemap when the server starts
initializeSitemap().catch(console.error);

// Get all sitemap URLs
const getAllUrls = async (req, res) => {
  try {
    const xmlData = await fs.readFile(SITEMAP_PATH, 'utf-8');
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xmlData);
    
    const urls = (result.urlset?.url || []).map((url, index) => ({
      id: index,
      loc: url.loc?.[0] || '',
      lastmod: url.lastmod?.[0] || null,
      changefreq: url.changefreq?.[0] || null,
      priority: url.priority?.[0] || null
    }));
    
    return res.status(200).json({
      success: true,
      data: urls,
      total: urls.length
    });
  } catch (error) {
    if (error.code === 'ENOENT') {
      // If file doesn't exist, return empty array instead of error
      return res.status(200).json({
        success: true,
        data: [],
        total: 0,
        message: 'Sitemap not found, returning empty list'
      });
    }
    console.error('Error reading sitemap:', error);
    return res.status(500).json({
      success: false,
      message: 'Error reading sitemap file',
      error: error.message
    });
  }
};

// Add new URL to sitemap
const addUrl = async (req, res) => {
  try {
    const { loc, lastmod, changefreq, priority } = req.body;
    
    // Validate required field
    if (!loc) {
      return res.status(400).json({
        success: false,
        message: 'URL (loc) is required'
      });
    }
    
    // Read existing sitemap
    const xmlData = await fs.readFile(SITEMAP_PATH, 'utf-8');
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xmlData);
    
    // Create new URL entry
    const newUrl = {
      loc: [loc]
    };
    
    if (lastmod) newUrl.lastmod = [lastmod];
    if (changefreq) newUrl.changefreq = [changefreq];
    if (priority) newUrl.priority = [priority];
    
    // Add to urlset
    result.urlset.url.push(newUrl);
    
    // Build XML
    const builder = new xml2js.Builder({
      xmldec: { version: '1.0', encoding: 'UTF-8' }
    });
    const xml = builder.buildObject(result);
    
    // Write back to file
    await fs.writeFile(SITEMAP_PATH, xml, 'utf-8');
    
    res.status(201).json({
      success: true,
      message: 'URL added successfully to sitemap',
      data: newUrl
    });
  } catch (error) {
    console.error('Error adding URL to sitemap:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding URL to sitemap',
      error: error.message
    });
  }
};

// Update existing URL in sitemap
const updateUrl = async (req, res) => {
  try {
    const { id } = req.params;
    const { loc, lastmod, changefreq, priority } = req.body;
    
    // Validate required field
    if (!loc) {
      return res.status(400).json({
        success: false,
        message: 'URL (loc) is required'
      });
    }
    
    // Read existing sitemap
    const xmlData = await fs.readFile(SITEMAP_PATH, 'utf-8');
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xmlData);
    
    const urlIndex = parseInt(id);
    
    if (urlIndex < 0 || urlIndex >= result.urlset.url.length) {
      return res.status(404).json({
        success: false,
        message: 'URL not found'
      });
    }
    
    // Update URL entry
    const updatedUrl = {
      loc: [loc]
    };
    
    if (lastmod) updatedUrl.lastmod = [lastmod];
    if (changefreq) updatedUrl.changefreq = [changefreq];
    if (priority) updatedUrl.priority = [priority];
    
    result.urlset.url[urlIndex] = updatedUrl;
    
    // Build XML
    const builder = new xml2js.Builder({
      xmldec: { version: '1.0', encoding: 'UTF-8' }
    });
    const xml = builder.buildObject(result);
    
    // Write back to file
    await fs.writeFile(SITEMAP_PATH, xml, 'utf-8');
    
    res.status(200).json({
      success: true,
      message: 'URL updated successfully',
      data: updatedUrl
    });
  } catch (error) {
    console.error('Error updating URL in sitemap:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating URL in sitemap',
      error: error.message
    });
  }
};

// Delete URL from sitemap
const deleteUrl = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Read existing sitemap
    const xmlData = await fs.readFile(SITEMAP_PATH, 'utf-8');
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xmlData);
    
    const urlIndex = parseInt(id);
    
    if (urlIndex < 0 || urlIndex >= result.urlset.url.length) {
      return res.status(404).json({
        success: false,
        message: 'URL not found'
      });
    }
    
    // Remove URL
    const deletedUrl = result.urlset.url.splice(urlIndex, 1)[0];
    
    // Build XML
    const builder = new xml2js.Builder({
      xmldec: { version: '1.0', encoding: 'UTF-8' }
    });
    const xml = builder.buildObject(result);
    
    // Write back to file
    await fs.writeFile(SITEMAP_PATH, xml, 'utf-8');
    
    res.status(200).json({
      success: true,
      message: 'URL deleted successfully',
      data: deletedUrl
    });
  } catch (error) {
    console.error('Error deleting URL from sitemap:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting URL from sitemap',
      error: error.message
    });
  }
};

// Get single URL by ID
const getUrlById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const xmlData = await fs.readFile(SITEMAP_PATH, 'utf-8');
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xmlData);
    
    const urlIndex = parseInt(id);
    
    if (urlIndex < 0 || urlIndex >= result.urlset.url.length) {
      return res.status(404).json({
        success: false,
        message: 'URL not found'
      });
    }
    
    const url = result.urlset.url[urlIndex];
    const urlData = {
      id: urlIndex,
      loc: url.loc[0],
      lastmod: url.lastmod ? url.lastmod[0] : null,
      changefreq: url.changefreq ? url.changefreq[0] : null,
      priority: url.priority ? url.priority[0] : null
    };
    
    res.status(200).json({
      success: true,
      data: urlData
    });
  } catch (error) {
    console.error('Error reading URL from sitemap:', error);
    res.status(500).json({
      success: false,
      message: 'Error reading URL from sitemap',
      error: error.message
    });
  }
};

module.exports = {
  getAllUrls,
  addUrl,
  updateUrl,
  deleteUrl,
  getUrlById
};
