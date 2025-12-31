import { IUser, UserRole, UserStatus } from '../../../shared/types';

export class User implements IUser {
    constructor(
        public id: string,
        public email: string,
        public name: string,
        public role: UserRole,
        public status: UserStatus,
        public createdAt: Date,
        public lastLogin?: Date
    ) { }

    isAdmin(): boolean {
        return this.role === UserRole.ADMIN;
    }

    canEdit(): boolean {
        return this.role === UserRole.ADMIN || this.role === UserRole.OPERATOR;
    }

    canView(): boolean {
        return this.status === UserStatus.ACTIVE;
    }

    hasPermission(permission: string): boolean {
        const permissions: Record<UserRole, string[]> = {
            [UserRole.ADMIN]: ['*'],
            [UserRole.OPERATOR]: [
                'products:read',
                'products:write',
                'warehouses:read',
                'movements:read',
                'movements:write',
                'reports:read',
            ],
            [UserRole.VIEWER]: [
                'products:read',
                'warehouses:read',
                'movements:read',
                'reports:read',
            ],
        };

        const userPermissions = permissions[this.role];
        return userPermissions.includes('*') || userPermissions.includes(permission);
    }
}
