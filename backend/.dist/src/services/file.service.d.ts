export declare const ensureUploadDir: () => Promise<void>;
export declare const deleteFile: (filepath: string) => Promise<void>;
export declare const getFileExtension: (filename: string) => string;
export declare const isImageFile: (mimetype: string) => boolean;
export declare const isVideoFile: (mimetype: string) => boolean;
export declare const validateFile: (file: Express.Multer.File) => void;
//# sourceMappingURL=file.service.d.ts.map