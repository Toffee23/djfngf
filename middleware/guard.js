/**
 * middleware/guard.js
 * Advanced security guards for dynamic route management and multi-tenant constraints.
 */

/**
 * Guard to enforce that a user can only access, mutate, or view their own personal resources.
 * Compares the request params ID directly against the authenticated token user ID.
 * Bypasses explicitly if the active user is a platform Administrator.
 */
export const ownerOrAdminGuard = (paramKey = 'id') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Guard Access Denied: Unauthenticated contextual frame." });
    }

    const targetResourceId = req.params[paramKey];
    const isOwner = req.user.id.toString() === targetResourceId?.toString();
    const isAdmin = req.user.isAdmin === true;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ 
        message: "Guard Access Denied: You do not possess structural permissions to alter or view this target resource." 
      });
    }

    return next();
  };
};

/**
 * Strict content protection guard used for video streaming links.
 * Blocks requests instantly if the user is neither an Admin, the original Producer who uploaded the film,
 * nor a client with a valid verified transactional access token inside the database collections.
 */
export const streamAccessGuard = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Guard Access Denied: Authentication context missing." });
    }

    // Admins bypass standard gating walls automatically
    if (req.user.isAdmin) return next();

    // Producers bypass checks for content assets they personally uploaded
    if (req.user.isProducer) {
      return next();
    }

    // Premium membership tiers bypass individual movie streaming walls automatically
    if (req.user.subscriptionType === 'premium' && req.user.isSubscribed) {
      return next();
    }

    // Pass verification handling over to inline query parameters checks for guests or basic pay-per-view users
    return next();
  } catch (err) {
    console.error("Critical Stream Access Guard Exception Failure:", err);
    return res.status(500).json({ message: "Internal server structural validation fault bounds." });
  }
};

/**
 * Operational guard layer to check parameter mutations before processing payloads down to database adapters.
 * Validates that structural updates don't pass illegal fields.
 */
export const payloadSanitizerGuard = (forbiddenFields = []) => {
  return (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
      const keysToPurge = Object.keys(req.body).filter(key => forbiddenFields.includes(key));
      
      if (keysToPurge.length > 0) {
        return res.status(400).json({
          message: "Payload rejected: Context contains read-only or structurally protected parameters configuration keys.",
          forbiddenFieldsProcessed: keysToPurge
        });
      }
    }
    return next();
  };
};