import { isActiveAdmin } from "@/core/domain/account-rules";
import { ForbiddenError } from "@/core/domain/errors";
import type { AuthenticatedUser } from "@/core/ports/auth-service.port";
import type { AppUser, UserRepository } from "@/core/ports/user-repository.port";

export interface ListUsersDeps {
  users: UserRepository;
}

export interface ListUsersInput {
  actingUser: AuthenticatedUser;
}

export function makeListUsers(deps: ListUsersDeps) {
  return async function listUsers(input: ListUsersInput): Promise<AppUser[]> {
    if (!isActiveAdmin(input.actingUser)) {
      throw new ForbiddenError();
    }
    return deps.users.findAll();
  };
}
