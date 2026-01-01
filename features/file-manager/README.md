# File Manager Feature Module

Module ini berisi semua logic, constants, dan utilities untuk File Manager feature.

## 📁 Struktur

```
file-manager/
├── constants/         # Static data & configurations
│   ├── file-icons.ts       # Icon mappings
│   ├── file-types.ts       # File type categorizations
│   └── default-config.ts   # Default configs & types
│
├── utils/            # Helper functions (pure functions)
│   ├── file-helpers.ts     # General file utilities
│   ├── media-helpers.ts    # Media handling
│   └── path-helpers.ts     # Path manipulation
│
├── hooks/            # Custom React hooks (future)
│   └── useFileOperations.example.ts
│
├── types/            # TypeScript definitions
│   └── index.ts
│
└── index.ts          # Barrel export
```

## 🚀 Quick Start

### Import individual utilities:
```typescript
import { getFileIcon } from '@/features/file-manager/utils/file-helpers';
import { buildMediaList } from '@/features/file-manager/utils/media-helpers';
import { buildBreadcrumbs } from '@/features/file-manager/utils/path-helpers';
```

### Or import from barrel file:
```typescript
import { 
  getFileIcon, 
  buildMediaList, 
  buildBreadcrumbs,
  DEFAULT_PATH,
  FILE_ICON_MAP 
} from '@/features/file-manager';
```

## 📚 API Documentation

### File Helpers (`file-helpers.ts`)

#### `getFileIcon(fileName: string, type: string)`
Get icon configuration for a file.
```typescript
const icon = getFileIcon('document.pdf', 'file');
// Returns: { iconClass: 'fas fa-file-pdf', bgColor: 'bg-red-50', textColor: 'text-red-600' }
```

#### `isImageFile(fileName: string)`
Check if file is an image.
```typescript
const isImage = isImageFile('photo.jpg'); // true
```

#### `isVideoFile(fileName: string)`
Check if file is a video.
```typescript
const isVideo = isVideoFile('movie.mp4'); // true
```

#### `isEditableFile(fileName: string)`
Check if file can be edited in code editor.
```typescript
const canEdit = isEditableFile('style.css'); // true
```

#### `validateFileName(fileName: string)`
Validate file name.
```typescript
const error = validateFileName('file/name.txt'); 
// Returns: "File name cannot contain / or \"
```

---

### Media Helpers (`media-helpers.ts`)

#### `buildMediaList(files, currentPath, apiUrl)`
Build list of media files for preview.
```typescript
const mediaList = buildMediaList(files, '/public_html', 'http://localhost:3000');
```

#### `findMediaIndex(mediaList, fileName)`
Find index of media file in list.
```typescript
const index = findMediaIndex(mediaList, 'photo.jpg');
```

---

### Path Helpers (`path-helpers.ts`)

#### `buildBreadcrumbs(currentPath)`
Generate breadcrumb trail.
```typescript
const breadcrumbs = buildBreadcrumbs('/public_html/images/photos');
// Returns: [
//   { name: 'public_html', path: '/public_html', index: 0 },
//   { name: 'images', path: '/public_html/images', index: 1 },
//   { name: 'photos', path: '/public_html/images/photos', index: 2 }
// ]
```

#### `navigateToFolder(currentPath, folderName)`
Navigate into a folder.
```typescript
const newPath = navigateToFolder('/public_html', 'images');
// Returns: '/public_html/images'
```

#### `navigateToParent(currentPath)`
Navigate to parent directory.
```typescript
const parentPath = navigateToParent('/public_html/images');
// Returns: '/public_html'
```

---

## 🎨 Constants

### File Icons (`file-icons.ts`)
```typescript
import { FILE_ICON_MAP, FOLDER_ICON, DEFAULT_FILE_ICON } from './constants/file-icons';

// Use directly
const phpIcon = FILE_ICON_MAP['php'];
```

### File Types (`file-types.ts`)
```typescript
import { IMAGE_EXTENSIONS, VIDEO_EXTENSIONS, EDITABLE_EXTENSIONS } from './constants/file-types';

// Check if extension is editable
const isEditable = EDITABLE_EXTENSIONS.includes('tsx'); // true
```

### Default Config (`default-config.ts`)
```typescript
import { DEFAULT_PATH, DEFAULT_STATS } from './constants/default-config';

const [currentPath, setCurrentPath] = useState(DEFAULT_PATH);
```

---

## 🔧 Adding New Features

### Adding New File Type
1. Add to `constants/file-types.ts`:
```typescript
export const NEW_TYPE_EXTENSIONS = ['ext1', 'ext2'] as const;
```

2. Add icon mapping in `constants/file-icons.ts`:
```typescript
'ext1': { iconClass: 'fas fa-new-icon', bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
```

3. Add helper if needed in `utils/file-helpers.ts`:
```typescript
export const isNewType = (fileName: string): boolean => {
  const ext = getFileExtension(fileName);
  return NEW_TYPE_EXTENSIONS.includes(ext as any);
};
```

### Adding New Utility
Create new file in `utils/` folder:
```typescript
// utils/new-helper.ts
export const newHelperFunction = (param: string): string => {
  // Implementation
};
```

Then export from `index.ts`:
```typescript
export * from './utils/new-helper';
```

---

## ✅ Best Practices

1. **Pure Functions**: All functions in `utils/` should be pure (no side effects)
2. **Type Safety**: Always use TypeScript types from `types/index.ts`
3. **Testing**: Each utility should be easily testable
4. **Documentation**: Add JSDoc comments for all exported functions
5. **Naming**: Use clear, descriptive names

---

## 🧪 Testing

Example test for file-helpers:
```typescript
import { getFileIcon, isImageFile, validateFileName } from './utils/file-helpers';

describe('file-helpers', () => {
  test('getFileIcon returns correct icon for PDF', () => {
    const icon = getFileIcon('doc.pdf', 'file');
    expect(icon.iconClass).toBe('fas fa-file-pdf');
  });

  test('isImageFile detects JPG', () => {
    expect(isImageFile('photo.jpg')).toBe(true);
  });

  test('validateFileName catches invalid characters', () => {
    expect(validateFileName('file/name.txt')).not.toBeNull();
  });
});
```

---

## 🔄 Migration from Old Code

See `REFACTORING_GUIDE.md` in project root for detailed migration guide.

---

## 📄 License

Part of CloudKu project.
