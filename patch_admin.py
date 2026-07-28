path = "dorsera-memorial-repo/apps-web/app/admin/page.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

anchor = '''                <Link
                  href={`/admin/memorials/${r.memorial?.id}/gallery`}
                  className="underline"
                >
                  Galería
                </Link>'''

addition = '''
                <Link
                  href={`/admin/memorials/${r.memorial?.id}/timeline`}
                  className="underline"
                >
                  Línea de tiempo
                </Link>'''

if anchor not in content:
    raise SystemExit("ANCLA NO ENCONTRADA - no se modificó el archivo")

content = content.replace(anchor, anchor + addition, 1)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("OK - patched", path)
