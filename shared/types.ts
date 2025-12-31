// Shared types used across backend and frontend

export enum UserRole {
    ADMIN = 'ADMIN',
    OPERATOR = 'OPERATOR',
    VIEWER = 'VIEWER',
}

export enum UserStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    LOCKED = 'LOCKED',
}

export enum ProductStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    DISCONTINUED = 'DISCONTINUED',
}

export enum MovementType {
    IN = 'IN',
    OUT = 'OUT',
    ADJUSTMENT = 'ADJUSTMENT',
    TRANSFER = 'TRANSFER',
}

export enum SyncStatus {
    PENDING = 'PENDING',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
}

export enum SyncProvider {
    GOOGLE_DRIVE = 'GOOGLE_DRIVE',
    MEGA = 'MEGA',
    WEBDAV = 'WEBDAV',
}

export interface IUser {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    status: UserStatus;
    createdAt: Date;
    lastLogin?: Date;
}

export interface ICompany {
    id: string;
    commercialName: string;
    legalName: string;
    taxId: string;
    logoPath?: string;
    primaryColor: string;
    secondaryColor: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
}

export interface IBrandingConfig {
    id: string;
    companyId: string;
    systemName: string;
    tagline?: string;
    logoUrl?: string;
    faviconUrl?: string;
    primaryColor: string;
    secondaryColor: string;
    customCss?: string;
}

export interface IProduct {
    id: string;
    code: string;
    name: string;
    description?: string;
    categoryId?: string;
    unit: string;
    cost: number;
    price: number;
    minStock: number;
    maxStock?: number;
    barcode?: string;
    status: ProductStatus;
    stock?: IStock[];
}

export interface IWarehouse {
    id: string;
    name: string;
    location?: string;
    description?: string;
    companyId: string;
}

export interface IStock {
    id: string;
    productId: string;
    warehouseId: string;
    quantity: number;
    lastUpdated: Date;
}

export interface IInventoryMovement {
    id: string;
    type: MovementType;
    date: Date;
    userId: string;
    warehouseFromId?: string;
    warehouseToId?: string;
    notes?: string;
    reference?: string;
}

export interface IMovementItem {
    id: string;
    movementId: string;
    productId: string;
    quantity: number;
    cost: number;
    price: number;
    notes?: string;
}

export interface ICategory {
    id: string;
    name: string;
    description?: string;
    parentId?: string;
}

// DTOs for API communication

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    user: IUser;
    token: string;
}

export interface CreateProductRequest {
    code: string;
    name: string;
    description?: string;
    categoryId?: string;
    unit: string;
    cost: number;
    price: number;
    minStock: number;
    maxStock?: number;
    barcode?: string;
}

export interface CreateMovementRequest {
    type: MovementType;
    warehouseFromId?: string;
    warehouseToId?: string;
    notes?: string;
    reference?: string;
    items: {
        productId: string;
        quantity: number;
        cost: number;
        price: number;
        notes?: string;
    }[];
}

export interface StockLevel {
    productId: string;
    productCode: string;
    productName: string;
    warehouseId: string;
    warehouseName: string;
    quantity: number;
    minStock: number;
    maxStock?: number;
    status: 'OK' | 'LOW' | 'CRITICAL' | 'EXCESS';
}

export interface DashboardStats {
    totalProducts: number;
    totalWarehouses: number;
    lowStockItems: number;
    recentMovements: number;
    lastSyncDate?: Date;
    totalStockValue: number;
}

export interface SyncConfig {
    provider: SyncProvider;
    enabled: boolean;
    credentials: Record<string, any>;
    lastSync?: Date;
    autoSync: boolean;
    syncInterval?: number; // minutes
}

export interface BackupMetadata {
    filename: string;
    timestamp: Date;
    size: number;
    provider: SyncProvider;
}

// API Response wrapper
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

// Pagination
export interface PaginatedRequest {
    page: number;
    limit: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
