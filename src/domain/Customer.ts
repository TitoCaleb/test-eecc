export enum CustomerType {
  INDIVIDUAL = "INDIVIDUAL",
  BUSINESS = "BUSINESS",
}
export enum MaritalStatus {
  SINGLE = "SINGLE",
  MARRIED = "MARRIED",
  WIDOWED = "WIDOWED",
  DIVORCED = "DIVORCED",
}

export enum MarriageRegime {
  JOINT = "JOINT",
  SEPARATE = "SEPARATE",
  COMMON_LAW = "COMMON_LAW",
}

export enum IdentityDocumentType {
  DNI = "DNI",
  DCE = "DCE",
  RUC = "RUC",
  PASAPORTE = "PASAPORTE",
}

export enum PepStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

export class Customer {
  id: string;

  type: CustomerType;

  name: string;

  middleName?: string;

  lastName: string;

  motherLastName: string;

  residenceCountry: string;

  birthday: string;

  nationality: string;

  identityDocuments: {
    type: string;
    number: string;
  }[];

  ruc?: string;

  nit?: string;

  maritalStatus: MaritalStatus;

  marriage?: {
    regime: {
      type: MarriageRegime;
      date?: string;
      metadata?: Record<string, unknown>;
    };
    spouse: {
      name: string;
      lastName: string;
      identityDocument: {
        type: IdentityDocumentType;
        number: string;
      };
      pep: {
        status: PepStatus;
      };
    };
  };

  education: {
    profession: string;
  };

  email: string;

  mobile: string;

  address: {
    street: string;
    location?: {
      level1: string;
      level2: string;
      level3: string;
    };
  };

  constructor(data?: Partial<Customer>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  getEventData() {
    return {
      id: this.id,
      type: this.type,
    };
  }

  getLastNames() {
    return `${this.lastName ?? ""} ${this.motherLastName ?? ""}`;
  }

  getNames() {
    return `${this.name ?? ""} ${this.middleName ?? ""}`;
  }

  get mainIdentityDocumentNumber() {
    if (!this.identityDocuments || this.identityDocuments.length === 0) {
      return undefined;
    }
    return `${this.identityDocuments[0].type ?? ""} ${
      this.identityDocuments[0].number ?? ""
    }`;
  }
}
