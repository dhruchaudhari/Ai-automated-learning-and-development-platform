const User = require('../models/User');
const FinalMerit = require('../models/FinalMerit');
const AiAuditRecord = require('../models/AiAuditRecord');
const FitnessAllocation = require('../models/FitnessAllocation');
const Advertisement = require('../models/Advertisement');

/**
 * Performs deep cleanup of FinalMerit and AiAuditRecord collections
 * based on the existence of non-admin users.
 */
const cleanupOrphanedData = async () => {
    try {
        console.log('[Maintenance] Starting data integrity cleanup...');

        // 1. Check for presence of non-admin users
        const nonAdminCount = await User.countDocuments({ role: 'user' });

        if (nonAdminCount === 0) {
            console.log('[Maintenance] No user records found. Performing full wipe of merits and audits.');
            await Promise.all([
                FinalMerit.deleteMany({}),
                AiAuditRecord.deleteMany({})
            ]);
            return {
                status: 'wiped',
                message: 'All merit and audit records removed as no users exist.'
            };
        }

        // 2. Cleanup orphaned FinalMerit records
        const merits = await FinalMerit.find({});
        let meritDeletions = 0;

        for (const merit of merits) {
            // Check if every userId in this merit result still exists in User collection
            const userIds = merit.results.map(r => r.userId);
            const existingUsersCount = await User.countDocuments({ _id: { $in: userIds } });

            if (existingUsersCount !== userIds.length) {
                await FinalMerit.deleteOne({ _id: merit._id });
                meritDeletions++;
            }
        }

        // 3. Cleanup orphaned AiAuditRecord records
        const audits = await AiAuditRecord.find({});
        let auditDeletions = 0;

        for (const audit of audits) {
            // Check if admin exists
            const adminExists = await User.exists({ _id: audit.adminId });

            // Check if every userId in the changes array exists
            const entryUserIds = audit.changes.map(c => c.userId).filter(id => id); // filter nulls if any
            const existingEntriesCount = await User.countDocuments({ _id: { $in: entryUserIds } });

            if (!adminExists || existingEntriesCount !== entryUserIds.length) {
                await AiAuditRecord.deleteOne({ _id: audit._id });
                auditDeletions++;
            }
        }

        console.log(`[Maintenance] Cleanup finished. Deleted ${meritDeletions} merits and ${auditDeletions} audits.`);

        return {
            status: 'cleaned',
            deletedMerits: meritDeletions,
            deletedAudits: auditDeletions
        };

    } catch (error) {
        console.error('[Maintenance] Cleanup error:', error);
        throw error;
    }
};

/**
 * Performs cleanup of orphaned fitness allocations.
 * Deletes records if the referenced Advertisement or FinalMerit no longer exists.
 */
const cleanupOrphanedAllocations = async () => {
    try {
        const allocations = await FitnessAllocation.find();
        const orphanedIds = [];

        for (const alloc of allocations) {
            const [adExists, meritExists] = await Promise.all([
                Advertisement.exists({ _id: alloc.advertisementId }),
                FinalMerit.exists({ _id: alloc.meritListId })
            ]);

            if (!adExists || !meritExists) {
                orphanedIds.push(alloc._id);
            }
        }

        if (orphanedIds.length > 0) {
            await FitnessAllocation.deleteMany({ _id: { $in: orphanedIds } });
            console.log(`[Maintenance] Cleaned up ${orphanedIds.length} orphaned fitness allocations.`);
            return { deletedCount: orphanedIds.length };
        }
        return { deletedCount: 0 };
    } catch (err) {
        console.error('[Maintenance] Fitness cleanup error:', err);
        throw err;
    }
};

/**
 * Express Controller wrapper for manual trigger
 */
exports.manualCleanup = async (req, res) => {
    try {
        const result = await cleanupOrphanedData();
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Also export the logic function for internal route triggering
exports.cleanupOrphanedData = cleanupOrphanedData;
exports.cleanupOrphanedAllocations = cleanupOrphanedAllocations;
