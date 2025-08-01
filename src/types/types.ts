// types.ts
export type RootStackParamList = {
    Home: undefined;
    Details: { userId: string }; // Example: Details screen accepts userId
    Profile: undefined;
};

// Member Records Types
export interface Record {
    SAMPLEDATE: string;
    SHIFT: string;
    MILKTYPE: string;
    FAT: number;
    SNF: number;
    CLR: number;
    QTY: number;
    RATE: number;
    AMOUNT: number;
    INCENTIVEAMOUNT: number;
    TOTAL: number;
    photoUrl?: string;
}

export interface Total {
    _id: {
        milkType: string;
    };
    totalRecords: number;
    averageFat: number;
    averageSNF: number;
    averageCLR: number;
    totalQuantity: number;
    averageRate: number;
    totalAmount: number;
    totalIncentive: number;
}

export interface SummaryRecord {
    date: string;
    shift: string;
    totalRecords: number;
    totalQuantity: number;
    totalAmount: number;
    totalIncentive: number;
    grandTotal: number;
    photoUrl?: string;
}

export interface DetailedRecord {
    CODE: string;
    MEMBERNAME: string;
    MILKTYPE: string;
    FAT: number;
    SNF: number;
    CLR: number;
    QTY: number;
    RATE: number;
    AMOUNT: number;
    INCENTIVEAMOUNT: number;
    TOTAL: number;
    photoUrl?: string;
}

export interface DailyRecord {
    date: string;
    shift: string;
    records: DetailedRecord[];
    photoUrl?: string;
}

export interface CumulativeRecord {
    CODE: string;
    MEMBERNAME: string;
    totalRecords: number;
    totalQuantity: number;
    totalAmount: number;
    totalIncentive: number;
    grandTotal: number;
    averageFat: number;
    averageSNF: number;
    averageCLR: number;
    averageRate: number;
    photoUrl?: string;
    milkTypeBreakdown: {
        COW?: {
            records: number;
            quantity: number;
            amount: number;
        };
        BUF?: {
            records: number;
            quantity: number;
            amount: number;
        };
    };
}

export interface AbsentMemberRecord {
    CODE: string;
    MEMBERNAME: string;
    absentDates: string[];
    totalAbsentDays: number;
    lastPresentDate?: string;
    photoUrl?: string;
}

export interface Device {
    deviceid: string;
    members: Array<{
        CODE: string;
        MEMBERNAME: string;
    }>;
}

export interface UserInfo {
    deviceid?: string;
    dairyCode?: string;
}

export interface RootState {
    userInfoSlice: {
        userInfo: UserInfo;
    };
}

