const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

// Import your models (adjust paths according to your project structure)
const User = require("../models/User"); // Adjust path to your User model
const Property = require("../models/Property"); // Adjust path to your Property model

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Access token required' 
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret', (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false,
        message: 'Invalid or expired token' 
      });
    }
    req.user = user;
    next();
  });
};

// Admin authorization middleware
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ 
      success: false,
      message: 'Admin access required' 
    });
  }
};

/**
 * DELETE /postPerson/deleteUser/:id
 * REAL DATABASE DELETION - Permanently removes user and all associated data
 */
router.delete('/postPerson/deleteUser/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    
    console.log(`🗑️ Admin ${req.user.email || req.user.id} attempting to delete user: ${userId}`);
    
    // Validate user ID format (MongoDB ObjectId)
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user ID format' 
      });
    }

    // Check if user exists before deletion
    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found in database' 
      });
    }

    console.log(`📋 Found user to delete: ${userToDelete.name} (${userToDelete.email})`);

    // Step 1: Delete all properties associated with this user
    const deletedProperties = await Property.deleteMany({ 
      $or: [
        { userId: userId },
        { postPerson: userId },
        { owner: userId }
      ]
    });
    
    console.log(`🏠 Deleted ${deletedProperties.deletedCount} properties for user ${userId}`);

    // Step 2: Delete the user from database
    const deletedUser = await User.findByIdAndDelete(userId);
    
    if (!deletedUser) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to delete user from database' 
      });
    }

    // Log successful deletion
    console.log(`✅ Successfully deleted user from database: ${deletedUser.name} and ${deletedProperties.deletedCount} properties`);

    // Return success response
    res.status(200).json({
      success: true,
      message: 'User permanently deleted from database',
      data: {
        deletedUser: {
          id: deletedUser._id,
          name: deletedUser.name,
          email: deletedUser.email,
          mobile: deletedUser.mobile
        },
        deletedPropertiesCount: deletedProperties.deletedCount,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Database deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Critical error during database deletion',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * Alternative endpoint for user deletion
 */
router.delete('/postPerson/userDelete/:id', authenticateToken, requireAdmin, async (req, res) => {
  // Redirect to main deletion endpoint
  req.url = `/postPerson/deleteUser/${req.params.id}`;
  return router.handle(req, res);
});

/**
 * Admin endpoint for user deletion
 */
router.delete('/admin/user/delete/:id', authenticateToken, requireAdmin, async (req, res) => {
  // Redirect to main deletion endpoint
  req.url = `/postPerson/deleteUser/${req.params.id}`;
  return router.handle(req, res);
});

module.exports = router;
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

// Import your models (adjust paths according to your project structure)
const User = require("../models/User"); // Adjust path to your User model
const Property = require("../models/Property"); // Adjust path to your Property model

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Access token required' 
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret', (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false,
        message: 'Invalid or expired token' 
      });
    }
    req.user = user;
    next();
  });
};

// Admin authorization middleware
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ 
      success: false,
      message: 'Admin access required' 
    });
  }
};

/**
 * DELETE /postPerson/deleteUser/:id
 * REAL DATABASE DELETION - Permanently removes user and all associated data
 */
router.delete('/postPerson/deleteUser/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    
    console.log(`🗑️ Admin ${req.user.email || req.user.id} attempting to delete user: ${userId}`);
    
    // Validate user ID format (MongoDB ObjectId)
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user ID format' 
      });
    }

    // Check if user exists before deletion
    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found in database' 
      });
    }

    console.log(`📋 Found user to delete: ${userToDelete.name} (${userToDelete.email})`);

    // Step 1: Delete all properties associated with this user
    const deletedProperties = await Property.deleteMany({ 
      $or: [
        { userId: userId },
        { postPerson: userId },
        { owner: userId }
      ]
    });
    
    console.log(`🏠 Deleted ${deletedProperties.deletedCount} properties for user ${userId}`);

    // Step 2: Delete the user from database
    const deletedUser = await User.findByIdAndDelete(userId);
    
    if (!deletedUser) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to delete user from database' 
      });
    }

    // Log successful deletion
    console.log(`✅ Successfully deleted user from database: ${deletedUser.name} and ${deletedProperties.deletedCount} properties`);

    // Return success response
    res.status(200).json({
      success: true,
      message: 'User permanently deleted from database',
      data: {
        deletedUser: {
          id: deletedUser._id,
          name: deletedUser.name,
          email: deletedUser.email,
          mobile: deletedUser.mobile
        },
        deletedPropertiesCount: deletedProperties.deletedCount,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Database deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Critical error during database deletion',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * Alternative endpoint for user deletion
 */
router.delete('/postPerson/userDelete/:id', authenticateToken, requireAdmin, async (req, res) => {
  // Redirect to main deletion endpoint
  req.url = `/postPerson/deleteUser/${req.params.id}`;
  return router.handle(req, res);
});

/**
 * Admin endpoint for user deletion
 */
router.delete('/admin/user/delete/:id', authenticateToken, requireAdmin, async (req, res) => {
  // Redirect to main deletion endpoint
  req.url = `/postPerson/deleteUser/${req.params.id}`;
  return router.handle(req, res);
});

module.exports = router;
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

// Import your models (adjust paths according to your project structure)
const User = require("../models/User"); // Adjust path to your User model
const Property = require("../models/Property"); // Adjust path to your Property model

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Access token required' 
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret', (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false,
        message: 'Invalid or expired token' 
      });
    }
    req.user = user;
    next();
  });
};

// Admin authorization middleware
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ 
      success: false,
      message: 'Admin access required' 
    });
  }
};

/**
 * DELETE /postPerson/deleteUser/:id
 * REAL DATABASE DELETION - Permanently removes user and all associated data
 */
router.delete('/postPerson/deleteUser/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    
    console.log(`🗑️ Admin ${req.user.email || req.user.id} attempting to delete user: ${userId}`);
    
    // Validate user ID format (MongoDB ObjectId)
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user ID format' 
      });
    }

    // Check if user exists before deletion
    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found in database' 
      });
    }

    console.log(`📋 Found user to delete: ${userToDelete.name} (${userToDelete.email})`);

    // Step 1: Delete all properties associated with this user
    const deletedProperties = await Property.deleteMany({ 
      $or: [
        { userId: userId },
        { postPerson: userId },
        { owner: userId }
      ]
    });
    
    console.log(`🏠 Deleted ${deletedProperties.deletedCount} properties for user ${userId}`);

    // Step 2: Delete the user from database
    const deletedUser = await User.findByIdAndDelete(userId);
    
    if (!deletedUser) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to delete user from database' 
      });
    }

    // Log successful deletion
    console.log(`✅ Successfully deleted user from database: ${deletedUser.name} and ${deletedProperties.deletedCount} properties`);

    // Return success response
    res.status(200).json({
      success: true,
      message: 'User permanently deleted from database',
      data: {
        deletedUser: {
          id: deletedUser._id,
          name: deletedUser.name,
          email: deletedUser.email,
          mobile: deletedUser.mobile
        },
        deletedPropertiesCount: deletedProperties.deletedCount,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Database deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Critical error during database deletion',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * Alternative endpoint for user deletion
 */
router.delete('/postPerson/userDelete/:id', authenticateToken, requireAdmin, async (req, res) => {
  // Redirect to main deletion endpoint
  req.url = `/postPerson/deleteUser/${req.params.id}`;
  return router.handle(req, res);
});

/**
 * Admin endpoint for user deletion
 */
router.delete('/admin/user/delete/:id', authenticateToken, requireAdmin, async (req, res) => {
  // Redirect to main deletion endpoint
  req.url = `/postPerson/deleteUser/${req.params.id}`;
  return router.handle(req, res);
});

module.exports = router;
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

// Import your models (adjust paths according to your project structure)
const User = require("../models/User"); // Adjust path to your User model
const Property = require("../models/Property"); // Adjust path to your Property model

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Access token required' 
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret', (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false,
        message: 'Invalid or expired token' 
      });
    }
    req.user = user;
    next();
  });
};

// Admin authorization middleware
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ 
      success: false,
      message: 'Admin access required' 
    });
  }
};

/**
 * DELETE /postPerson/deleteUser/:id
 * REAL DATABASE DELETION - Permanently removes user and all associated data
 */
router.delete('/postPerson/deleteUser/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    
    console.log(`🗑️ Admin ${req.user.email || req.user.id} attempting to delete user: ${userId}`);
    
    // Validate user ID format (MongoDB ObjectId)
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user ID format' 
      });
    }

    // Check if user exists before deletion
    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found in database' 
      });
    }

    console.log(`📋 Found user to delete: ${userToDelete.name} (${userToDelete.email})`);

    // Step 1: Delete all properties associated with this user
    const deletedProperties = await Property.deleteMany({ 
      $or: [
        { userId: userId },
        { postPerson: userId },
        { owner: userId }
      ]
    });
    
    console.log(`🏠 Deleted ${deletedProperties.deletedCount} properties for user ${userId}`);

    // Step 2: Delete the user from database
    const deletedUser = await User.findByIdAndDelete(userId);
    
    if (!deletedUser) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to delete user from database' 
      });
    }

    // Log successful deletion
    console.log(`✅ Successfully deleted user from database: ${deletedUser.name} and ${deletedProperties.deletedCount} properties`);

    // Return success response
    res.status(200).json({
      success: true,
      message: 'User permanently deleted from database',
      data: {
        deletedUser: {
          id: deletedUser._id,
          name: deletedUser.name,
          email: deletedUser.email,
          mobile: deletedUser.mobile
        },
        deletedPropertiesCount: deletedProperties.deletedCount,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Database deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Critical error during database deletion',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * Alternative endpoint for user deletion
 */
router.delete('/postPerson/userDelete/:id', authenticateToken, requireAdmin, async (req, res) => {
  // Redirect to main deletion endpoint
  req.url = `/postPerson/deleteUser/${req.params.id}`;
  return router.handle(req, res);
});

/**
 * Admin endpoint for user deletion
 */
router.delete('/admin/user/delete/:id', authenticateToken, requireAdmin, async (req, res) => {
  // Redirect to main deletion endpoint
  req.url = `/postPerson/deleteUser/${req.params.id}`;
  return router.handle(req, res);
});

module.exports = router;
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

// Import your models (adjust paths according to your project structure)
const User = require("../models/User"); // Adjust path to your User model
const Property = require("../models/Property"); // Adjust path to your Property model

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Access token required' 
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret', (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false,
        message: 'Invalid or expired token' 
      });
    }
    req.user = user;
    next();
  });
};

// Admin authorization middleware
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ 
      success: false,
      message: 'Admin access required' 
    });
  }
};

/**
 * DELETE /postPerson/deleteUser/:id
 * REAL DATABASE DELETION - Permanently removes user and all associated data
 */
router.delete('/postPerson/deleteUser/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    
    console.log(`🗑️ Admin ${req.user.email || req.user.id} attempting to delete user: ${userId}`);
    
    // Validate user ID format (MongoDB ObjectId)
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user ID format' 
      });
    }

    // Check if user exists before deletion
    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found in database' 
      });
    }

    console.log(`📋 Found user to delete: ${userToDelete.name} (${userToDelete.email})`);

    // Step 1: Delete all properties associated with this user
    const deletedProperties = await Property.deleteMany({ 
      $or: [
        { userId: userId },
        { postPerson: userId },
        { owner: userId }
      ]
    });
    
    console.log(`🏠 Deleted ${deletedProperties.deletedCount} properties for user ${userId}`);

    // Step 2: Delete the user from database
    const deletedUser = await User.findByIdAndDelete(userId);
    
    if (!deletedUser) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to delete user from database' 
      });
    }

    // Log successful deletion
    console.log(`✅ Successfully deleted user from database: ${deletedUser.name} and ${deletedProperties.deletedCount} properties`);

    // Return success response
    res.status(200).json({
      success: true,
      message: 'User permanently deleted from database',
      data: {
        deletedUser: {
          id: deletedUser._id,
          name: deletedUser.name,
          email: deletedUser.email,
          mobile: deletedUser.mobile
        },
        deletedPropertiesCount: deletedProperties.deletedCount,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Database deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Critical error during database deletion',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * Alternative endpoint for user deletion
 */
router.delete('/postPerson/userDelete/:id', authenticateToken, requireAdmin, async (req, res) => {
  // Redirect to main deletion endpoint
  req.url = `/postPerson/deleteUser/${req.params.id}`;
  return router.handle(req, res);
});

/**
 * Admin endpoint for user deletion
 */
router.delete('/admin/user/delete/:id', authenticateToken, requireAdmin, async (req, res) => {
  // Redirect to main deletion endpoint
  req.url = `/postPerson/deleteUser/${req.params.id}`;
  return router.handle(req, res);
});

module.exports = router;
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

// Import your models (adjust paths according to your project structure)
const User = require("../models/User"); // Adjust path to your User model
const Property = require("../models/Property"); // Adjust path to your Property model

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Access token required' 
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret', (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false,
        message: 'Invalid or expired token' 
      });
    }
    req.user = user;
    next();
  });
};

// Admin authorization middleware
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ 
      success: false,
      message: 'Admin access required' 
    });
  }
};

/**
 * DELETE /postPerson/deleteUser/:id
 * REAL DATABASE DELETION - Permanently removes user and all associated data
 */
router.delete('/postPerson/deleteUser/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    
    console.log(`🗑️ Admin ${req.user.email || req.user.id} attempting to delete user: ${userId}`);
    
    // Validate user ID format (MongoDB ObjectId)
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user ID format' 
      });
    }

    // Check if user exists before deletion
    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found in database' 
      });
    }

    console.log(`📋 Found user to delete: ${userToDelete.name} (${userToDelete.email})`);

    // Step 1: Delete all properties associated with this user
    const deletedProperties = await Property.deleteMany({ 
      $or: [
        { userId: userId },
        { postPerson: userId },
        { owner: userId }
      ]
    });
    
    console.log(`🏠 Deleted ${deletedProperties.deletedCount} properties for user ${userId}`);

    // Step 2: Delete the user from database
    const deletedUser = await User.findByIdAndDelete(userId);
    
    if (!deletedUser) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to delete user from database' 
      });
    }

    // Log successful deletion
    console.log(`✅ Successfully deleted user from database: ${deletedUser.name} and ${deletedProperties.deletedCount} properties`);

    // Return success response
    res.status(200).json({
      success: true,
      message: 'User permanently deleted from database',
      data: {
        deletedUser: {
          id: deletedUser._id,
          name: deletedUser.name,
          email: deletedUser.email,
          mobile: deletedUser.mobile
        },
        deletedPropertiesCount: deletedProperties.deletedCount,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Database deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Critical error during database deletion',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * Alternative endpoint for user deletion
 */
router.delete('/postPerson/userDelete/:id', authenticateToken, requireAdmin, async (req, res) => {
  // Redirect to main deletion endpoint
  req.url = `/postPerson/deleteUser/${req.params.id}`;
  return router.handle(req, res);
});

/**
 * Admin endpoint for user deletion
 */
router.delete('/admin/user/delete/:id', authenticateToken, requireAdmin, async (req, res) => {
  // Redirect to main deletion endpoint
  req.url = `/postPerson/deleteUser/${req.params.id}`;
  return router.handle(req, res);
});

module.exports = router;
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

// Import your models (adjust paths according to your project structure)
const User = require("../models/User"); // Adjust path to your User model
const Property = require("../models/Property"); // Adjust path to your Property model

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Access token required' 
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret', (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false,
        message: 'Invalid or expired token' 
      });
    }
    req.user = user;
    next();
  });
};

// Admin authorization middleware
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ 
      success: false,
      message: 'Admin access required' 
    });
  }
};

/**
 * DELETE /postPerson/deleteUser/:id
 * REAL DATABASE DELETION - Permanently removes user and all associated data
 */
router.delete('/postPerson/deleteUser/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    
    console.log(`🗑️ Admin ${req.user.email || req.user.id} attempting to delete user: ${userId}`);
    
    // Validate user ID format (MongoDB ObjectId)
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user ID format' 
      });
    }

    // Check if user exists before deletion
    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found in database' 
      });
    }

    console.log(`📋 Found user to delete: ${userToDelete.name} (${userToDelete.email})`);

    // Step 1: Delete all properties associated with this user
    const deletedProperties = await Property.deleteMany({ 
      $or: [
        { userId: userId },
        { postPerson: userId },
        { owner: userId }
      ]
    });
    
    console.log(`🏠 Deleted ${deletedProperties.deletedCount} properties for user ${userId}`);

    // Step 2: Delete the user from database
    const deletedUser = await User.findByIdAndDelete(userId);
    
    if (!deletedUser) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to delete user from database' 
      });
    }

    // Log successful deletion
    console.log(`✅ Successfully deleted user from database: ${deletedUser.name} and ${deletedProperties.deletedCount} properties`);

    // Return success response
    res.status(200).json({
      success: true,
      message: 'User permanently deleted from database',
      data: {
        deletedUser: {
          id: deletedUser._id,
          name: deletedUser.name,
          email: deletedUser.email,
          mobile: deletedUser.mobile
        },
        deletedPropertiesCount: deletedProperties.deletedCount,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Database deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Critical error during database deletion',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * Alternative endpoint for user deletion
 */
router.delete('/postPerson/userDelete/:id', authenticateToken, requireAdmin, async (req, res) => {
  // Redirect to main deletion endpoint
  req.url = `/postPerson/deleteUser/${req.params.id}`;
  return router.handle(req, res);
});

/**
 * Admin endpoint for user deletion
 */
router.delete('/admin/user/delete/:id', authenticateToken, requireAdmin, async (req, res) => {
  // Redirect to main deletion endpoint
  req.url = `/postPerson/deleteUser/${req.params.id}`;
  return router.handle(req, res);
});

module.exports = router;
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

// Import your models (adjust paths according to your project structure)
const User = require("../models/User"); // Adjust path to your User model
const Property = require("../models/Property"); // Adjust path to your Property model

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Access token required' 
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret', (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false,
        message: 'Invalid or expired token' 
      });
    }
    req.user = user;
    next();
  });
};

// Admin authorization middleware
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ 
      success: false,
      message: 'Admin access required' 
    });
  }
};

/**
 * DELETE /postPerson/deleteUser/:id
 * REAL DATABASE DELETION - Permanently removes user and all associated data
 */
router.delete('/postPerson/deleteUser/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    
    console.log(`🗑️ Admin ${req.user.email || req.user.id} attempting to delete user: ${userId}`);
    
    // Validate user ID format (MongoDB ObjectId)
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user ID format' 
      });
    }

    // Check if user exists before deletion
    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found in database' 
      });
    }

    console.log(`📋 Found user to delete: ${userToDelete.name} (${userToDelete.email})`);

    // Step 1: Delete all properties associated with this user
    const deletedProperties = await Property.deleteMany({ 
      $or: [
        { userId: userId },
        { postPerson: userId },
        { owner: userId }
      ]
    });
    
    console.log(`🏠 Deleted ${deletedProperties.deletedCount} properties for user ${userId}`);

    // Step 2: Delete the user from database
    const deletedUser = await User.findByIdAndDelete(userId);
    
    if (!deletedUser) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to delete user from database' 
      });
    }

    // Log successful deletion
    console.log(`✅ Successfully deleted user from database: ${deletedUser.name} and ${deletedProperties.deletedCount} properties`);

    // Return success response
    res.status(200).json({
      success: true,
      message: 'User permanently deleted from database',
      data: {
        deletedUser: {
          id: deletedUser._id,
          name: deletedUser.name,
          email: deletedUser.email,
          mobile: deletedUser.mobile
        },
        deletedPropertiesCount: deletedProperties.deletedCount,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Database deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Critical error during database deletion',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * Alternative endpoint for user deletion
 */
router.delete('/postPerson/userDelete/:id', authenticateToken, requireAdmin, async (req, res) => {
  // Redirect to main deletion endpoint
  req.url = `/postPerson/deleteUser/${req.params.id}`;
  return router.handle(req, res);
});

/**
 * Admin endpoint for user deletion
 */
router.delete('/admin/user/delete/:id', authenticateToken, requireAdmin, async (req, res) => {
  // Redirect to main deletion endpoint
  req.url = `/postPerson/deleteUser/${req.params.id}`;
  return router.handle(req, res);
});

module.exports = router;
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

// Import your models (adjust paths according to your project structure)
const User = require("../models/User"); // Adjust path to your User model
const Property = require("../models/Property"); // Adjust path to your Property model

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Access token required' 
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret', (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false,
        message: 'Invalid or expired token' 
      });
    }
    req.user = user;
    next();
  });
};

// Admin authorization middleware
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ 
      success: false,
      message: 'Admin access required' 
    });
  }
};

/**
 * DELETE /postPerson/deleteUser/:id
 * REAL DATABASE DELETION - Permanently removes user and all associated data
 */
router.delete('/postPerson/deleteUser/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    
    console.log(`🗑️ Admin ${req.user.email || req.user.id} attempting to delete user: ${userId}`);
    
    // Validate user ID format (MongoDB ObjectId)
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user ID format' 
      });
    }

    // Check if user exists before deletion
    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found in database' 
      });
    }

    console.log(`📋 Found user to delete: ${userToDelete.name} (${userToDelete.email})`);

    // Step 1: Delete all properties associated with this user
    const deletedProperties = await Property.deleteMany({ 
      $or: [
        { userId: userId },
        { postPerson: userId },
        { owner: userId }
      ]
    });
    
    console.log(`🏠 Deleted ${deletedProperties.deletedCount} properties for user ${userId}`);

    // Step 2: Delete the user from database
    const deletedUser = await User.findByIdAndDelete(userId);
    
    if (!deletedUser) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to delete user from database' 
      });
    }

    // Log successful deletion
    console.log(`✅ Successfully deleted user from database: ${deletedUser.name} and ${deletedProperties.deletedCount} properties`);

    // Return success response
    res.status(200).json({
      success: true,
      message: 'User permanently deleted from database',
      data: {
        deletedUser: {
          id: deletedUser._id,
          name: deletedUser.name,
          email: deletedUser.email,
          mobile: deletedUser.mobile
        },
        deletedPropertiesCount: deletedProperties.deletedCount,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Database deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Critical error during database deletion',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * Alternative endpoint for user deletion
 */
router.delete('/postPerson/userDelete/:id', authenticateToken, requireAdmin, async (req, res) => {
  // Redirect to main deletion endpoint
  req.url = `/postPerson/deleteUser/${req.params.id}`;
  return router.handle(req, res);
});

/**
 * Admin endpoint for user deletion
 */
router.delete('/admin/user/delete/:id', authenticateToken, requireAdmin, async (req, res) => {
  // Redirect to main deletion endpoint
  req.url = `/postPerson/deleteUser/${req.params.id}`;
  return router.handle(req, res);
});

module.exports = router;
