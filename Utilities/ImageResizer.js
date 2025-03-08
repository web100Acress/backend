// imageCompressor.js This is utility function to compress the Image into desisred ration/percentage
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

/**
 * Compresses an image using Sharp library
 * @param {string} inputPath - Path to input image
 * @param {string} outputPath - Path to save compressed image
 * @param {number} quality - Quality level (1-100), lower means more compression
 * @param {number} [resizeFactor=1] - Optional resize factor (0-1) to reduce dimensions
 * @returns {Promise<Object>} - Object containing size information
 */
async function compressImage(inputPath, outputPath, quality = 25, resizeFactor = 1) {
  try {
    // Get input file info
    const inputStats = fs.statSync(inputPath);
    const inputSize = inputStats.size;
    const extension = path.extname(inputPath).toLowerCase();
    
    // Get image metadata
    const metadata = await sharp(inputPath).metadata();
    
    // Process the image based on its format
    let sharpInstance = sharp(inputPath);
    
    // Apply resize if needed
    if (resizeFactor < 1) {
      const newWidth = Math.round(metadata.width * resizeFactor);
      sharpInstance = sharpInstance.resize(newWidth);
    }
    
    // Apply format-specific compression
    if (extension === '.jpg' || extension === '.jpeg') {
      sharpInstance = sharpInstance.jpeg({ quality });
    } else if (extension === '.png') {
      sharpInstance = sharpInstance.png({ quality });
    } else if (extension === '.webp') {
      sharpInstance = sharpInstance.webp({ quality });
    } else if (extension === '.avif') {
      sharpInstance = sharpInstance.avif({ quality });
    } else {
      // For other formats, convert to jpeg
      sharpInstance = sharpInstance.jpeg({ quality });
      outputPath = outputPath.replace(extension, '.jpg');
    }
    
    // Save the compressed image
    await sharpInstance.toFile(outputPath);
    
    // Get output file info
    const outputStats = fs.statSync(outputPath);
    const outputSize = outputStats.size;
    const compressionRatio = (1 - (outputSize / inputSize)) * 100;
    
    return {
      inputPath,
      outputPath,
      originalSize: formatBytes(inputSize),
      compressedSize: formatBytes(outputSize),
      compressionRatio: compressionRatio.toFixed(2) + '%',
      dimensions: {
        original: `${metadata.width}x${metadata.height}`,
        compressed: resizeFactor < 1 ? 
          `${Math.round(metadata.width * resizeFactor)}x${Math.round(metadata.height * resizeFactor)}` : 
          `${metadata.width}x${metadata.height}`
      }
    };
  } catch (error) {
    console.error('Error during image compression:', error);
    throw error;
  }
}

/**
 * Format bytes to human-readable format
 * @param {number} bytes - Number of bytes
 * @returns {string} - Formatted string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
   
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Compress all images in a directory
 * @param {string} inputDir - Input directory path
 * @param {string} outputDir - Output directory path
 * @param {number} quality - Quality level (1-100)
 * @param {number} [resizeFactor=1] - Optional resize factor (0-1)
 * @returns {Promise<Array>} - Array of results
 */
async function compressImagesInDirectory(inputDir, outputDir, quality, resizeFactor = 1) {
  try {
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Get all files in the input directory
    const files = fs.readdirSync(inputDir);
    
    // Filter image files
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(ext);
    });
    
    console.log(`Found ${imageFiles.length} images to compress`);
    
    // Process each image
    const results = [];
    for (const file of imageFiles) {
      const inputPath = path.join(inputDir, file);
      const outputPath = path.join(outputDir, file);
      
      console.log(`Compressing: ${file}`);
      const result = await compressImage(inputPath, outputPath, quality, resizeFactor);
      results.push(result);
    }
    
    return results;
  } catch (error) {
    console.error('Error compressing directory:', error);
    throw error;
  }
}

// Export functions for use in other modules
module.exports = {
  compressImage,
  compressImagesInDirectory
};

// Command line usage example
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.log(`
Usage:
  Single image: node imageCompressor.js --single <inputPath> <outputPath> <quality> [resizeFactor]
  Directory:    node imageCompressor.js --dir <inputDir> <outputDir> <quality> [resizeFactor]
  
Examples:
  node imageCompressor.js --single ./images/photo.jpg ./compressed/photo.jpg 50
  node imageCompressor.js --dir ./images ./compressed 50 0.8
`);
    process.exit(1);
  }
  
  const mode = args[0];
  
  if (mode === '--single') {
    const [inputPath, outputPath, quality, resizeFactor] = args.slice(1);
    
    compressImage(inputPath, outputPath, parseInt(quality, 10), resizeFactor ? parseFloat(resizeFactor) : 1)
      .then(result => {
        console.log('Compression complete:');
        console.table(result);
      })
      .catch(error => {
        console.error('Compression failed:', error);
      });
  } else if (mode === '--dir') {
    const [inputDir, outputDir, quality, resizeFactor] = args.slice(1);
    
    compressImagesInDirectory(inputDir, outputDir, parseInt(quality, 10), resizeFactor ? parseFloat(resizeFactor) : 1)
      .then(results => {
        console.log('All images compressed:');
        console.table(results);
        
        // Calculate average compression
        const avgCompression = results.reduce((sum, result) => {
          return sum + parseFloat(result.compressionRatio);
        }, 0) / results.length;
        
        console.log(`Average compression ratio: ${avgCompression.toFixed(2)}%`);
      })
      .catch(error => {
        console.error('Directory compression failed:', error);
      });
  } else {
    console.log('Invalid mode. Use --single or --dir');
  }
}

