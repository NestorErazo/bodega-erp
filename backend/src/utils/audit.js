import prisma from '../db.js';

// Función utilitaria para registrar en auditoría
export async function logAudit(userId, action, entity, entityId = null, details = null) {
  try {
    await prisma.auditLog.create({
      data: { userId, action, entity, entityId, details: details ? JSON.stringify(details) : null },
    });
  } catch (e) {
    console.error('Error al registrar auditoría:', e.message);
  }
}

export default logAudit;