const fs = require('fs').promises;
const path = require('path');
const xml2js = require('xml2js');

// Configurable sitemap path (set SITEMAP_FILE in environment). Fallback to /app/public/sitemap.xml inside container.
const SITEMAP_PATH = process.env.SITEMAP_FILE || path.join(process.cwd(), 'public', 'sitemap.xml');


// Get all sitemap URLs
const getAllUrls = async (req, res) => {
  try {
    console.log('Reading sitemap from:', SITEMAP_PATH);
    
    const xmlData = await fs.readFile(SITEMAP_PATH, 'utf-8');
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xmlData);
    
    // Handle case where urlset.url might not exist
    const urls = (result.urlset && result.urlset.url) ? result.urlset.url.map((url, index) => ({
      id: index,
      loc: url.loc[0],
      lastmod: url.lastmod ? url.lastmod[0] : null,
      changefreq: url.changefreq ? url.changefreq[0] : null,
      priority: url.priority ? url.priority[0] : null
    })) : [];
    
    res.status(200).json({
      success: true,
      data: urls,
      total: urls.length
    });
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      // File missing -> return empty list so UI doesn't break
      console.warn('Sitemap file not found at:', SITEMAP_PATH);
      return res.status(200).json({ success: true, data: [], total: 0, message: 'Sitemap file not found', path: SITEMAP_PATH });
    }
    console.error('Error reading sitemap:', error);
    res.status(500).json({
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
