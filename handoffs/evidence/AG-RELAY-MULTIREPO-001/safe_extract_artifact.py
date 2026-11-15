import hashlib
import json
from pathlib import Path, PurePosixPath
import stat
import sys
import zipfile

archive, destination, expected = Path(sys.argv[1]), Path(sys.argv[2]), sys.argv[3]
if hashlib.sha256(archive.read_bytes()).hexdigest() != expected:
    raise SystemExit('artifact digest mismatch')
if destination.exists():
    raise SystemExit('destination must be fresh')
with zipfile.ZipFile(archive) as bundle:
    names = set()
    total = 0
    for entry in bundle.infolist():
        value = entry.filename
        path = PurePosixPath(value)
        kind = stat.S_IFMT(entry.external_attr >> 16)
        if (path.is_absolute() or '..' in path.parts or '\\' in value or
                path.as_posix() != value.rstrip('/') or value in names or
                kind not in (0, stat.S_IFREG, stat.S_IFDIR) or
                entry.file_size > 2 * 1024 * 1024 or entry.flag_bits & 1):
            raise SystemExit('unsafe ZIP member')
        names.add(value)
        total += entry.file_size
    if total > 16 * 1024 * 1024 or len(names) > 300:
        raise SystemExit('oversized artifact')
    destination.mkdir(parents=True)
    bundle.extractall(destination)
inventory = {p.relative_to(destination).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest()
             for p in sorted(destination.rglob('*')) if p.is_file()}
print(json.dumps({'archive_sha256': expected, 'files': inventory}, sort_keys=True))
