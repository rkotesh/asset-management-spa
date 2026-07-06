import User from '../models/User.js';
import Asset from '../models/Asset.js';
import DownloadLog from '../models/DownloadLog.js';
import LoginLog from '../models/LoginLog.js';

// Helper to get UTC midnight Date for n days ago
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

// @desc    Get dashboard counters overview (KPIs)
// @route   GET /api/dashboard/overview
// @access  Private/Admin
export const getOverview = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      adminUsers,
      newUsers7d,
      newUsers30d,
      totalAssets,
      assetSizeResult,
      totalDownloads,
      downloads7d,
      loginsToday,
      logins7d,
      uniqueUsers7dResult
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
      User.countDocuments({ status: 'inactive' }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ createdAt: { $gte: daysAgo(7) } }),
      User.countDocuments({ createdAt: { $gte: daysAgo(30) } }),
      Asset.countDocuments(),
      Asset.aggregate([{ $group: { _id: null, totalSize: { $sum: '$size' } } }]),
      DownloadLog.countDocuments(),
      DownloadLog.countDocuments({ at: { $gte: daysAgo(7) } }),
      LoginLog.countDocuments({ at: { $gte: todayStart } }),
      LoginLog.countDocuments({ at: { $gte: daysAgo(7) } }),
      LoginLog.distinct('userId', { at: { $gte: daysAgo(7) } })
    ]);

    const totalStorageBytes = assetSizeResult[0]?.totalSize || 0;
    const uniqueUsers7d = uniqueUsers7dResult.length;

    res.status(200).json({
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        admin: adminUsers,
        newLast7Days: newUsers7d,
        newLast30Days: newUsers30d
      },
      assets: {
        total: totalAssets,
        totalStorageBytes
      },
      downloads: {
        total: totalDownloads,
        last7Days: downloads7d
      },
      logins: {
        today: loginsToday,
        last7Days: logins7d,
        uniqueUsersLast7Days: uniqueUsers7d
      }
    });
  } catch (error) {
    console.error('getOverview Error:', error.message);
    res.status(500).json({ error: true, message: 'Failed to fetch dashboard overview metrics.' });
  }
};

// @desc    Get login activity timeline series (for charts)
// @route   GET /api/dashboard/login-activity
// @access  Private/Admin
export const getLoginActivity = async (req, res) => {
  try {
    let days = parseInt(req.query.days, 10) || 14;
    if (isNaN(days) || days < 1) days = 14;
    if (days > 90) days = 90;

    const startDate = daysAgo(days);

    const logs = await LoginLog.aggregate([
      {
        $match: {
          at: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$at' }
          },
          logins: { $sum: 1 },
          usersList: { $addToSet: '$userId' }
        }
      },
      {
        $project: {
          date: '$_id',
          logins: 1,
          uniqueUsers: { $size: '$usersList' },
          _id: 0
        }
      },
      {
        $sort: { date: 1 }
      }
    ]);

    // Zero-fill days with no logins
    const result = [];
    const logsMap = new Map(logs.map(log => [log.date, log]));

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      if (logsMap.has(dateStr)) {
        result.push(logsMap.get(dateStr));
      } else {
        result.push({
          date: dateStr,
          logins: 0,
          uniqueUsers: 0
        });
      }
    }

    res.status(200).json({ activity: result });
  } catch (error) {
    console.error('getLoginActivity Error:', error.message);
    res.status(500).json({ error: true, message: 'Failed to fetch login activity metrics.' });
  }
};

// @desc    Get detailed user metrics (table list)
// @route   GET /api/dashboard/users
// @access  Private/Admin
export const getUserAnalytics = async (req, res) => {
  try {
    const users = await User.aggregate([
      {
        $lookup: {
          from: 'assets',
          localField: '_id',
          foreignField: 'uploadedBy',
          as: 'userAssets'
        }
      },
      {
        $lookup: {
          from: 'downloadlogs',
          localField: '_id',
          foreignField: 'userId',
          as: 'userDownloads'
        }
      },
      {
        $lookup: {
          from: 'loginlogs',
          localField: '_id',
          foreignField: 'userId',
          as: 'userLogins'
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          role: 1,
          status: 1,
          notifications_enabled: 1,
          createdAt: 1,
          lastLogin: 1,
          loginCount: 1,
          uploadsCount: { $size: '$userAssets' },
          downloadsCount: { $size: '$userDownloads' },
          lastActivityAt: {
            $ifNull: [
              { $max: '$userLogins.at' },
              '$lastLogin',
              '$createdAt'
            ]
          }
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]);

    res.status(200).json({ users });
  } catch (error) {
    console.error('getUserAnalytics Error:', error.message);
    res.status(500).json({ error: true, message: 'Failed to fetch user analytics metrics.' });
  }
};

// @desc    Get breakdown of assets by file type
// @route   GET /api/dashboard/asset-breakdown
// @access  Private/Admin
export const getAssetBreakdown = async (req, res) => {
  try {
    const breakdown = await Asset.aggregate([
      {
        $group: {
          _id: '$fileType',
          count: { $sum: 1 },
          totalSize: { $sum: '$size' }
        }
      },
      {
        $project: {
          fileType: '$_id',
          count: 1,
          totalSize: 1,
          _id: 0
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.status(200).json({ breakdown });
  } catch (error) {
    console.error('getAssetBreakdown Error:', error.message);
    res.status(500).json({ error: true, message: 'Failed to fetch asset breakdown metrics.' });
  }
};
