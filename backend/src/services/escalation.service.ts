import prisma from '../config/database';
import { notifyGrievanceStatusChange } from './notification.service';
import blockchainService from './blockchain.service';

// Authority levels in order of hierarchy
const AUTHORITY_HIERARCHY = ['gro', 'officer', 'nodal_officer', 'director'];

class EscalationService {
  // Check and escalate overdue grievances
  async checkAndEscalateOverdue(): Promise<number> {
    const now = new Date();

    // Find grievances that are overdue and not yet escalated
    const overdueGrievances = await prisma.grievance.findMany({
      where: {
        status: { in: ['pending', 'acknowledged', 'in_progress'] },
        isEscalated: false,
        estimatedResolutionDate: { lt: now },
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            authorityLevel: true,
            departmentId: true,
          },
        },
        department_rel: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    let escalatedCount = 0;

    for (const grievance of overdueGrievances) {
      try {
        await this.escalateGrievance(grievance);
        escalatedCount++;
      } catch (error) {
        console.error(`Failed to escalate grievance ${grievance.id}:`, error);
      }
    }

    if (escalatedCount > 0) {
      console.log(`Auto-escalated ${escalatedCount} overdue grievances`);
    }

    return escalatedCount;
  }

  // Escalate a single grievance to higher authority
  async escalateGrievance(grievance: any): Promise<void> {
    const currentLevel = grievance.assignedTo?.authorityLevel || 'gro';
    const currentLevelIndex = AUTHORITY_HIERARCHY.indexOf(currentLevel);
    const nextLevelIndex = Math.min(currentLevelIndex + 1, AUTHORITY_HIERARCHY.length - 1);
    const nextLevel = AUTHORITY_HIERARCHY[nextLevelIndex];

    // Find higher authority in the same department
    let newAssignee = null;
    if (grievance.departmentId) {
      newAssignee = await prisma.user.findFirst({
        where: {
          role: 'authority',
          departmentId: grievance.departmentId,
          authorityLevel: nextLevel,
        },
        select: { id: true, name: true, authorityLevel: true },
      });
    }

    // If no higher authority found in department, find any with next level
    if (!newAssignee && nextLevelIndex > currentLevelIndex) {
      newAssignee = await prisma.user.findFirst({
        where: {
          role: 'authority',
          authorityLevel: nextLevel,
        },
        select: { id: true, name: true, authorityLevel: true },
      });
    }

    const escalationMessage = newAssignee
      ? `Auto-escalated due to missed ETA. Reassigned from ${grievance.assignedTo?.name || 'unassigned'} to ${newAssignee.name} (${nextLevel})`
      : `Auto-escalated due to missed ETA. No higher authority available.`;

    // Update grievance
    await prisma.grievance.update({
      where: { id: grievance.id },
      data: {
        isEscalated: true,
        escalatedAt: new Date(),
        assignedToId: newAssignee?.id || grievance.assignedToId,
      },
    });

    // Create update record
    const update = await prisma.grievanceUpdate.create({
      data: {
        grievanceId: grievance.id,
        userId: grievance.assignedToId || grievance.userId,
        status: 'escalated',
        message: escalationMessage,
      },
    });

    // Record on blockchain
    if (grievance.blockchainHash && blockchainService.isAvailable()) {
      blockchainService
        .updateGrievanceStatus(grievance.blockchainHash, 'escalated', escalationMessage)
        .then(async (txHash) => {
          if (txHash) {
            await prisma.grievanceUpdate.update({
              where: { id: update.id },
              data: { blockchainTxHash: txHash },
            });
          }
        })
        .catch((error) => {
          console.error('Failed to record escalation on blockchain:', error);
        });
    }

    // Send notification
    await notifyGrievanceStatusChange(grievance.id, 'escalated', escalationMessage);
  }

  // Start periodic escalation check
  startPeriodicCheck(intervalMinutes: number = 60): NodeJS.Timeout {
    console.log(`Starting auto-escalation check every ${intervalMinutes} minutes`);

    // Run immediately on start
    this.checkAndEscalateOverdue();

    // Then run periodically
    return setInterval(
      () => this.checkAndEscalateOverdue(),
      intervalMinutes * 60 * 1000
    );
  }
}

export default new EscalationService();
