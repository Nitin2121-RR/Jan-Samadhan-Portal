import prisma from '../config/database';

/**
 * Priority Calculation Service
 *
 * Calculates grievance priority based on:
 * - AI-determined severity (30%)
 * - Upvote count (25%)
 * - Time pending (25%)
 * - Category urgency (20%)
 */

// Category urgency weights (1-10 scale)
const CATEGORY_URGENCY: Record<string, number> = {
  'Public Safety': 10,
  'Healthcare': 9,
  'Water Supply': 8,
  'Electricity': 8,
  'Drainage & Sewage': 7,
  'Roads & Infrastructure': 7,
  'Traffic Issues': 6,
  'Garbage Collection': 6,
  'Pension & Welfare': 5,
  'Ration & Food': 5,
  'Education': 4,
  'Street Lights': 4,
  'Land & Property': 3,
  'Parks & Gardens': 2,
  'Other': 3,
};

// Status weights - unresolved issues get higher priority
const STATUS_MULTIPLIER: Record<string, number> = {
  'pending': 1.2,
  'acknowledged': 1.0,
  'in_progress': 0.8,
  'escalated': 1.5,
  'resolved': 0.1,
};

interface PriorityFactors {
  severity: number;          // 1-10 from AI
  upvotes: number;           // count
  hoursOld: number;          // time since creation
  category: string;          // for category urgency
  status: string;            // for status multiplier
  isEscalated: boolean;
}

interface PriorityBreakdown {
  totalScore: number;
  severityScore: number;
  upvoteScore: number;
  timeScore: number;
  categoryScore: number;
  urgencyLevel: 'critical' | 'high' | 'medium' | 'low';
}

class PriorityService {
  /**
   * Calculate priority score for a grievance
   * Returns a score from 0-100
   */
  calculatePriority(factors: PriorityFactors): PriorityBreakdown {
    // Normalize severity (1-10) to 0-100
    const severityScore = (factors.severity / 10) * 100;

    // Normalize upvotes using logarithmic scale (caps at ~50 upvotes for max score)
    const upvoteScore = Math.min(100, Math.log10(factors.upvotes + 1) * 60);

    // Time score - increases over time (caps at 30 days)
    // Formula: score increases rapidly in first 7 days, then slower
    const daysOld = factors.hoursOld / 24;
    const timeScore = Math.min(100, (Math.log10(daysOld + 1) / Math.log10(31)) * 100);

    // Category urgency score
    const categoryUrgency = CATEGORY_URGENCY[factors.category] || 3;
    const categoryScore = (categoryUrgency / 10) * 100;

    // Calculate weighted total
    const weightedTotal =
      (severityScore * 0.30) +    // 30% weight for severity
      (upvoteScore * 0.25) +      // 25% weight for community support
      (timeScore * 0.25) +        // 25% weight for time pending
      (categoryScore * 0.20);     // 20% weight for category urgency

    // Apply status multiplier
    const statusMultiplier = STATUS_MULTIPLIER[factors.status] || 1.0;
    let totalScore = weightedTotal * statusMultiplier;

    // Escalated issues get a boost
    if (factors.isEscalated) {
      totalScore = Math.min(100, totalScore * 1.3);
    }

    // Determine urgency level
    let urgencyLevel: 'critical' | 'high' | 'medium' | 'low';
    if (totalScore >= 80) urgencyLevel = 'critical';
    else if (totalScore >= 60) urgencyLevel = 'high';
    else if (totalScore >= 40) urgencyLevel = 'medium';
    else urgencyLevel = 'low';

    return {
      totalScore: Math.round(Math.min(100, Math.max(0, totalScore))),
      severityScore: Math.round(severityScore),
      upvoteScore: Math.round(upvoteScore),
      timeScore: Math.round(timeScore),
      categoryScore: Math.round(categoryScore),
      urgencyLevel,
    };
  }

  /**
   * Recalculate priority for a single grievance
   */
  async recalculateGrievancePriority(grievanceId: string): Promise<number> {
    const grievance = await prisma.grievance.findUnique({
      where: { id: grievanceId },
      include: {
        _count: {
          select: { upvotes: true },
        },
      },
    });

    if (!grievance) {
      throw new Error('Grievance not found');
    }

    const hoursOld = (Date.now() - grievance.createdAt.getTime()) / (1000 * 60 * 60);

    const priority = this.calculatePriority({
      severity: grievance.severity,
      upvotes: grievance._count.upvotes,
      hoursOld,
      category: grievance.category,
      status: grievance.status,
      isEscalated: grievance.isEscalated,
    });

    // Update the priority score in database
    await prisma.grievance.update({
      where: { id: grievanceId },
      data: { priorityScore: priority.totalScore },
    });

    return priority.totalScore;
  }

  /**
   * Recalculate priority for all unresolved grievances
   */
  async recalculateAllPriorities(): Promise<{ updated: number; errors: number }> {
    const grievances = await prisma.grievance.findMany({
      where: {
        status: { not: 'resolved' },
      },
      include: {
        _count: {
          select: { upvotes: true },
        },
      },
    });

    let updated = 0;
    let errors = 0;

    for (const grievance of grievances) {
      try {
        const hoursOld = (Date.now() - grievance.createdAt.getTime()) / (1000 * 60 * 60);

        const priority = this.calculatePriority({
          severity: grievance.severity,
          upvotes: grievance._count.upvotes,
          hoursOld,
          category: grievance.category,
          status: grievance.status,
          isEscalated: grievance.isEscalated,
        });

        await prisma.grievance.update({
          where: { id: grievance.id },
          data: { priorityScore: priority.totalScore },
        });

        updated++;
      } catch (error) {
        console.error(`Failed to update priority for grievance ${grievance.id}:`, error);
        errors++;
      }
    }

    return { updated, errors };
  }

  /**
   * Get priority breakdown for a grievance
   */
  async getPriorityBreakdown(grievanceId: string): Promise<PriorityBreakdown | null> {
    const grievance = await prisma.grievance.findUnique({
      where: { id: grievanceId },
      include: {
        _count: {
          select: { upvotes: true },
        },
      },
    });

    if (!grievance) {
      return null;
    }

    const hoursOld = (Date.now() - grievance.createdAt.getTime()) / (1000 * 60 * 60);

    return this.calculatePriority({
      severity: grievance.severity,
      upvotes: grievance._count.upvotes,
      hoursOld,
      category: grievance.category,
      status: grievance.status,
      isEscalated: grievance.isEscalated,
    });
  }

  /**
   * Get grievances sorted by calculated priority
   */
  async getGrievancesByPriority(options: {
    department?: string;
    assignedToId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    const where: any = {};

    if (options.department) {
      where.department = { contains: options.department, mode: 'insensitive' };
    }
    if (options.assignedToId) {
      where.assignedToId = options.assignedToId;
    }
    if (options.status) {
      where.status = options.status;
    } else {
      where.status = { not: 'resolved' };
    }

    const grievances = await prisma.grievance.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            department: true,
          },
        },
        files: {
          take: 1,
        },
        _count: {
          select: { upvotes: true },
        },
      },
      orderBy: {
        priorityScore: 'desc',
      },
      take: options.limit || 50,
      skip: options.offset || 0,
    });

    // Add priority breakdown to each grievance
    return grievances.map((g) => {
      const hoursOld = (Date.now() - g.createdAt.getTime()) / (1000 * 60 * 60);
      const breakdown = this.calculatePriority({
        severity: g.severity,
        upvotes: g._count.upvotes,
        hoursOld,
        category: g.category,
        status: g.status,
        isEscalated: g.isEscalated,
      });

      return {
        ...g,
        upvotes: g._count.upvotes,
        image: g.files[0]?.filepath || null,
        priorityBreakdown: breakdown,
      };
    });
  }
}

export default new PriorityService();
