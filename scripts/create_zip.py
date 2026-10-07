#!/usr/bin/env python3
import os
import zipfile

def create_project_zip():
    base_dir = '/app/applet'
    output_zip = os.path.join(base_dir, 'public', 'proyecto-gregory-izquierdo.zip')
    
    # Excluded directories and file patterns
    exclude_dirs = {
        'node_modules',
        '.git',
        'dist',
        '.cache',
        'build',
        '.aistudio'
    }
    
    exclude_files = {
        'proyecto-gregory-izquierdo.zip'
    }

    print(f"Creating ZIP archive at {output_zip}...")
    
    count = 0
    with zipfile.ZipFile(output_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(base_dir):
            # Prune excluded directories
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            
            for file in files:
                if file in exclude_files:
                    continue
                file_path = os.path.join(root, file)
                # Compute relative archive path
                arcname = os.path.relpath(file_path, base_dir)
                zipf.write(file_path, arcname)
                count += 1

    print(f"Successfully created ZIP with {count} files. Size: {os.path.getsize(output_zip)} bytes.")

if __name__ == '__main__':
    create_project_zip()
