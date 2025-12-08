const fs = require('fs').promises;
const path = require('path');
const xml2js = require('xml2js');


// Path to sitemap.xml file - check multiple possible locations
const getPossibleSitemapPaths = () => {
  const paths = [
    path.join(__dirname, '../../../100acressFront', 'public', 'sitemap.xml'), // Development
    path.join(__dirname, '..', '..', 'public', 'sitemap.xml'), // Production
    path.join(__dirname, '..', '..', '..', 'public', 'sitemap.xml'), // Alternative production
    path.join(process.cwd(), 'public', 'sitemap.xml'), // Current working directory
    path.join(process.cwd(), '100acressFront', 'public', 'sitemap.xml'), // Production with frontend folder
    path.join(process.cwd(), 'frontend', '100acressFront', 'public', 'sitemap.xml'), // Alternative structure
    path.join(process.cwd(), 'client', 'public', 'sitemap.xml'), // Another common structure
    '/var/www/html/public/sitemap.xml', // Common production path
    '/home/site/wwwroot/public/sitemap.xml', // Azure path
    '/var/www/vhosts/100acress.com/httpdocs/public/sitemap.xml', // Plesk path
    path.join('/usr', 'local', 'etc', 'nginx', 'html', 'public', 'sitemap.xml'), // Nginx path
  ];
  console.log('Checking sitemap paths:', paths);
  return paths;
};

const SITEMAP_PATH = getPossibleSitemapPaths()[0]; // Default to first path

// Helper function to find the actual sitemap file
const findSitemapPath = async () => {
  const paths = getPossibleSitemapPaths();
  
  console.log('Searching for sitemap in', paths.length, 'locations...');
  
  for (let i = 0; i < paths.length; i++) {
    const currentPath = paths[i];
    try {
      await fs.access(currentPath);
      const stats = await fs.stat(currentPath);
      console.log(`✓ Found sitemap at path ${i + 1}:`, currentPath);
      console.log(`  File size: ${stats.size} bytes, Modified: ${stats.mtime}`);
      return currentPath;
    } catch (error) {
      console.log(`✗ Path ${i + 1} not accessible:`, currentPath, '-', error.message);
      continue;
    }
  }
  
  // If no sitemap found, create a default one in the current working directory
  const defaultPath = path.join(process.cwd(), 'public', 'sitemap.xml');
  console.log('⚠️ No existing sitemap found, creating default at:', defaultPath);
  
  try {
    await fs.mkdir(path.dirname(defaultPath), { recursive: true });
    const defaultSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.100acress.com/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <priority>1.0</priority>
  </url>
</urlset>`;
    await fs.writeFile(defaultPath, defaultSitemap, 'utf-8');
    console.log('✓ Created default sitemap with 1 URL');
    return defaultPath;
  } catch (error) {
    throw new Error(`Sitemap file not found and could not create default. Searched in: ${paths.join(', ')}. Error: ${error.message}`);
  }
};


// Get all sitemap URLs
const getAllUrls = async (req, res) => {
  try {
    const sitemapPath = await findSitemapPath();
    console.log('Found sitemap at:', sitemapPath);
    const xmlData = await fs.readFile(sitemapPath, 'utf-8');
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
    console.log('Add URL request received:', req.body);
    
    const sitemapPath = await findSitemapPath();
    console.log('Found sitemap at:', sitemapPath);
    
    const { loc, lastmod, changefreq, priority } = req.body;
    
    // Validate required field
    if (!loc) {
      return res.status(400).json({
        success: false,
        message: 'URL (loc) is required'
      });
    }
    
    // Read existing sitemap
    const xmlData = await fs.readFile(sitemapPath, 'utf-8');
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
    await fs.writeFile(sitemapPath, xml, 'utf-8');
    
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
  getUrlById,
  findSitemapPath
};
