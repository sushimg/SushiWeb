import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// Bu TEST dosyası node: kullanabilir — kural kaynak dosyalar için geçerli.
const SRC = join(import.meta.dirname, '..')

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap(entry => {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      return entry === '__tests__' ? [] : sourceFiles(full)
    }
    return full.endsWith('.ts') ? [full] : []
  })
}

describe('identity-core bağımsızlığı', () => {
  it('package.json içinde hiçbir çalışma zamanı bağımlılığı yoktur', () => {
    const pkg = JSON.parse(
      readFileSync(join(SRC, '..', 'package.json'), 'utf8'),
    ) as { dependencies?: Record<string, string> }
    expect(Object.keys(pkg.dependencies ?? {})).toEqual([])
  })

  it('hiçbir kaynak dosya node: modülü import etmez', () => {
    const offenders = sourceFiles(SRC).filter(file =>
      /from\s+['"]node:/.test(readFileSync(file, 'utf8')),
    )
    expect(offenders).toEqual([])
  })

  it('hiçbir kaynak dosya paket dışından import etmez', () => {
    // Yalnızca göreli importlara izin verilir. Bare specifier ('pg', 'next/…')
    // görüldüğü an çekirdek bir çalışma zamanına bağlanmış demektir.
    const bare = /from\s+['"](?![./])/
    const offenders = sourceFiles(SRC).filter(file =>
      bare.test(readFileSync(file, 'utf8')),
    )
    expect(offenders).toEqual([])
  })
})
