const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const xml2js = require('xml2js');

// Path to sitemap.xml file - works for both local and live server
const SITEMAP_PATH = path.join(__dirname, '../../..', '100acressFront', 'public', 'sitemap.xml');
// Alternative path for live server structure
const LIVE_SITEMAP_PATH = '/home/ubuntu/actions-runner-frontend/_work/100acressFront/100acressFront/public/sitemap.xml';

// Get the correct sitemap path based on environment
const getSitemapPath = async () => {
  // List of paths to try in order
  const pathsToTry = [
    LIVE_SITEMAP_PATH,
    SITEMAP_PATH,
    path.join(__dirname, '../../../100acressFront/public/sitemap.xml'),
    path.join(__dirname, '../../../../100acressFront/public/sitemap.xml'),
    path.join(process.cwd(), '../100acressFront/public/sitemap.xml'),
    path.join(process.cwd(), '../../100acressFront/public/sitemap.xml'),
    path.join(process.cwd(), '../../../100acressFront/public/sitemap.xml'),
    '/home/ubuntu/actions-runner-frontend/_work/100acressFront/100acressFront/public/sitemap.xml',
  ];
  
  for (const tryPath of pathsToTry) {
    try {
      await fs.access(tryPath);
      console.log('✓ Found sitemap at:', tryPath);
      return tryPath;
    } catch (e) {
      console.log('✗ Path not found:', tryPath);
    }
  }
  
  // If no path found, log the current working directory for debugging
  console.log('No sitemap found. Current working directory:', process.cwd());
  console.log('__dirname:', __dirname);
  
  // Return the primary path as fallback
  return SITEMAP_PATH;
};

// Create default sitemap.xml if it doesn't exist
const ensureSitemapExists = async (filePath) => {
  try {
    // Check if file exists
    await fs.access(filePath);
  } catch (error) {
    // File doesn't exist, create it with default structure
    console.log('Creating default sitemap.xml at:', filePath);
    const defaultSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.100acress.com/</loc>
    <lastmod>2025-01-01</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
    
    try {
      // Ensure directory exists
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      // Write default sitemap
      await fs.writeFile(filePath, defaultSitemap, 'utf-8');
      console.log('Default sitemap.xml created successfully');
    } catch (writeError) {
      console.error('Failed to create default sitemap:', writeError.message);
    }
  }
};

// Get all sitemap URLs
const getAllUrls = async (req, res) => {
  try {
    // Get the correct sitemap path
    const correctPath = await getSitemapPath();
    
    // Ensure sitemap file exists before trying to read
    await ensureSitemapExists(correctPath);
    
    console.log('Attempting to read sitemap from:', correctPath);
    
    let xmlData;
    let fileFound = false;
    
    try {
      xmlData = await fs.readFile(correctPath, 'utf-8');
      fileFound = true;
    } catch (fileError) {
      console.error('Primary path failed:', correctPath, fileError.message);
      
      // Try alternative paths for live server
      const alternativePaths = [
        LIVE_SITEMAP_PATH,
        SITEMAP_PATH,
        path.join(__dirname, '../../../public', 'sitemap.xml'),
        path.join(__dirname, '../../public', 'sitemap.xml'),
        path.join(process.cwd(), 'public', 'sitemap.xml'),
        path.join(process.cwd(), '100acressFront', 'public', 'sitemap.xml'),
      ];
      
      for (const altPath of alternativePaths) {
        try {
          console.log('Trying alternative path:', altPath);
          xmlData = await fs.readFile(altPath, 'utf-8');
          console.log('Successfully read from:', altPath);
          fileFound = true;
          break;
        } catch (e) {
          console.log('Alternative path failed:', altPath);
        }
      }
    }
    
    // If file not found, return empty array with success
    if (!fileFound) {
      console.warn('Sitemap file not found on any path. Returning empty array.');
      return res.status(200).json({
        success: true,
        data: [],
        total: 0,
        message: 'No sitemap file found. Please create one or add URLs.'
      });
    }
    
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
    console.error('Error reading sitemap:', error);
    // Return success with empty array instead of 500 error
    res.status(200).json({
      success: true,
      data: [],
      total: 0,
      message: 'Error reading sitemap file, returning empty array',
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
    
    // Get the correct sitemap path
    const correctPath = await getSitemapPath();
    
    // Ensure sitemap file exists before trying to read
    await ensureSitemapExists(correctPath);
    
    // Read existing sitemap
    const xmlData = await fs.readFile(correctPath, 'utf-8');
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
    
    // Get the correct sitemap path
    const correctPath = await getSitemapPath();
    
    // Ensure sitemap file exists before trying to read
    await ensureSitemapExists(correctPath);
    
    // Read existing sitemap
    const xmlData = await fs.readFile(correctPath, 'utf-8');
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
    
    // Get the correct sitemap path
    const correctPath = await getSitemapPath();
    
    // Read existing sitemap
    const xmlData = await fs.readFile(correctPath, 'utf-8');
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
