import { useEffect, useState } from 'react'
import { Drawer } from 'vaul'
import { ListTree } from 'lucide-react'

function useActiveSection(ids) {
  const [active, setActive] = useState(ids[0])
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-20% 0px -65% 0px' },
    )
    ids.forEach((id) => {
      const el = document.getElementById(id)
      if (el) obs.observe(el)
    })
    return () => obs.disconnect()
  }, [ids])
  return active
}

function Items({ items, active, onPick }) {
  return (
    <ol className="legend-list">
      {items.map((it) => (
        <li key={it.id}>
          <a
            href={`#${it.id}`}
            className={active === it.id ? 'is-active' : ''}
            aria-current={active === it.id ? 'location' : undefined}
            onClick={() => onPick?.()}
          >
            <span className={`legend-swatch sw-${it.swatch}`} aria-hidden="true" />
            <span>{it.label}</span>
            {it.meta && <span className="legend-meta num">{it.meta}</span>}
          </a>
        </li>
      ))}
    </ol>
  )
}

export default function Legend({ items }) {
  const active = useActiveSection(items.map((i) => i.id))
  const [open, setOpen] = useState(false)
  const current = items.find((i) => i.id === active)

  return (
    <>
      <aside className="legend" aria-label="Keterangan isi lembar">
        <div className="legend-title">Keterangan</div>
        <Items items={items} active={active} />
      </aside>

      <Drawer.Root open={open} onOpenChange={setOpen}>
        <Drawer.Trigger className="legend-fab">
          <ListTree size={18} aria-hidden="true" />
          <span>{current?.label || 'Keterangan'}</span>
        </Drawer.Trigger>
        <Drawer.Portal>
          <Drawer.Overlay className="drawer-overlay" />
          <Drawer.Content className="drawer" aria-describedby={undefined}>
            <div className="drawer-handle" aria-hidden="true" />
            <Drawer.Title className="legend-title">Keterangan</Drawer.Title>
            <Items items={items} active={active} onPick={() => setOpen(false)} />
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  )
}
