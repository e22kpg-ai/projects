import { ForbiddenError, UserNotFoundError } from "@/core/domain/errors";
import type { AuthenticatedUser, Role } from "@/core/ports/auth-service.port";
import type { AppUser, UserRepository } from "@/core/ports/user-repository.port";

export interface SetUserRoleDeps {
  users: UserRepository;
}

export interface SetUserRoleInput {
  actingUser: AuthenticatedUser;
  targetUserId: string;
  role: Role;
}

export function makeSetUserRole(deps: SetUserRoleDeps) {
  return async function setUserRole(input: SetUserRoleInput): Promise<AppUser> {
    if (input.actingUser.role !== "admin") {
      throw new ForbiddenError();
    }
    if (input.targetUserId === input.actingUser.id) {
      throw new ForbiddenError("ไม่สามารถเปลี่ยนสิทธิ์ของตัวเองได้");
    }

    const updated = await deps.users.updateRole(input.targetUserId, input.role);
    if (!updated) {
      throw new UserNotFoundError(input.targetUserId);
    }
    return updated;
  };
}
