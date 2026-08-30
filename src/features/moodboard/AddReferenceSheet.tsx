import { useEffect, useState } from 'react'
import { FileText, Image as ImageIcon, Link2, Palette, Type as TypeIcon } from 'lucide-react'
import type { ID, MoodItemKind, MoodPayload, MoodSection } from '@/data/types'
import { useStore } from '@/store/useStore'
import { PHOTO_SETS, photo, type PhotoSet } from '@/data/images'
import { cn, hashCode, readableOn } from '@/lib/utils'
import { Button, Pill } from '@/components/ui/primitives'
import { Field, Input, Select, Textarea } from '@/components/ui/form'
import { Sheet } from '@/components/ui/overlay'
import { toast } from '@/components/ui/feedback'

/* ============================================================================
   ADD REFERENCE
   Five short forms, one per kind of thing a creative actually collects. The
   image picker offers a curated library because there is no upload backend —
   see the README on what is mocked.
   ========================================================================== */

type Kind = Extract<MoodItemKind, 'image' | 'color' | 'type' | 'link' | 'note'>

const KINDS: Array<{ id: Kind; label: string; icon: typeof ImageIcon; hint: string }> = [
  { id: 'image', label: 'Image', icon: ImageIcon, hint: 'A photograph, a shot, a texture' },
  { id: 'color', label: 'Colour', icon: Palette, hint: 'A swatch with its values' },
  { id: 'type', label: 'Type', icon: TypeIcon, hint: 'A typeface and how to use it' },
  { id: 'link', label: 'Link', icon: Link2, hint: 'Something worth reading' },
  { id: 'note', label: 'Note', icon: FileText, hint: 'A constraint, a quote, a reminder' },
]

const TYPE_STACKS = [
  { family: 'Instrument Serif', stack: "'Instrument Serif', Georgia, serif", weight: 400 },
  { family: 'Inter', stack: "'Inter', Helvetica, Arial, sans-serif", weight: 400 },
  { family: 'Inter Medium', stack: "'Inter', Helvetica, Arial, sans-serif", weight: 600 },
  { family: 'Georgia', stack: 'Georgia, serif', weight: 400 },
  { family: 'Times New Roman', stack: "'Times New Roman', Times, serif", weight: 400 },
  { family: 'Courier New', stack: "'Courier New', Courier, monospace", weight: 400 },
]

const SUGGESTED_COLORS = [
  { hex: '#C7F33C', name: 'Signal lime' },
  { hex: '#E7E4DC', name: 'Raw linen' },
  { hex: '#2B2B28', name: 'Iron' },
  { hex: '#7A1F1F', name: 'Ox blood' },
  { hex: '#4A5340', name: 'Wet moss' },
  { hex: '#A8845C', name: 'Kraft' },
  { hex: '#8E96A0', name: 'Rain grey' },
  { hex: '#D9D6CE', name: 'Sea salt' },
]

export function AddReferenceSheet({
  boardId,
  sectionId,
  sections,
  onClose,
}: {
  boardId: ID
  sectionId: ID | null
  sections: MoodSection[]
  onClose: () => void
}) {
  const addMoodItem = useStore((s) => s.addMoodItem)
  const currentUserId = useStore((s) => s.settings.currentUserId)

  const [kind, setKind] = useState<Kind>('image')
  const [target, setTarget] = useState<ID>('')
  const [caption, setCaption] = useState('')

  // image
  const [set, setSet] = useState<PhotoSet>('interiors')
  const [pickedIndex, setPickedIndex] = useState(0)
  const [asMaterial, setAsMaterial] = useState(false)
  // colour
  const [hex, setHex] = useState('#C7F33C')
  const [colorName, setColorName] = useState('')
  // type
  const [stackIndex, setStackIndex] = useState(0)
  const [sample, setSample] = useState('')
  const [usage, setUsage] = useState('')
  // link
  const [url, setUrl] = useState('')
  const [linkTitle, setLinkTitle] = useState('')
  // note
  const [body, setBody] = useState('')

  useEffect(() => {
    if (sectionId) {
      setTarget(sectionId)
      setKind('image')
      setCaption('')
      setSample('')
      setUsage('')
      setUrl('')
      setLinkTitle('')
      setBody('')
      setColorName('')
      setPickedIndex(0)
      setAsMaterial(false)
    }
  }, [sectionId])

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!target) return

    let payload: MoodPayload
    let itemKind: MoodItemKind = kind

    switch (kind) {
      case 'image': {
        const id = PHOTO_SETS[set][pickedIndex % PHOTO_SETS[set].length]
        itemKind = asMaterial ? 'material' : 'image'
        payload = {
          kind: itemKind as 'image' | 'material',
          url: photo(id, 'tile'),
          artSeed: `${boardId}-${id}`,
          ratio: 4 / 3,
        }
        break
      }
      case 'color':
        if (!/^#?[0-9a-f]{3,6}$/i.test(hex)) return
        payload = {
          kind: 'color',
          hex: hex.startsWith('#') ? hex : `#${hex}`,
          name: colorName.trim() || 'Untitled swatch',
        }
        break
      case 'type': {
        const chosen = TYPE_STACKS[stackIndex]
        if (!sample.trim()) return
        payload = {
          kind: 'type',
          family: chosen.family,
          stack: chosen.stack,
          weight: chosen.weight,
          sample: sample.trim(),
          usage: usage.trim() || 'No usage note yet.',
        }
        break
      }
      case 'link':
        if (!url.trim()) return
        payload = {
          kind: 'link',
          url: url.trim(),
          title: linkTitle.trim() || url.trim(),
          site: safeHost(url.trim()),
        }
        break
      case 'note':
      default:
        if (!body.trim()) return
        payload = { kind: 'note', body: body.trim() }
        break
    }

    addMoodItem({
      boardId,
      sectionId: target,
      kind: itemKind,
      payload,
      caption: caption.trim(),
      tags: [],
      pinned: false,
      addedBy: currentUserId,
    })

    const section = sections.find((s) => s.id === target)
    toast.success('Reference added', { detail: section ? `In ${section.title}` : undefined })
    onClose()
  }

  const valid =
    kind === 'image'
      ? true
      : kind === 'color'
        ? /^#?[0-9a-fA-F]{3,6}$/.test(hex)
        : kind === 'type'
          ? sample.trim().length > 0
          : kind === 'link'
            ? url.trim().length > 0
            : body.trim().length > 0

  return (
    <Sheet
      open={sectionId !== null}
      onClose={onClose}
      title="Add a reference"
      description="Collect it now — captions and tags can come later."
      width="md"
    >
      <form onSubmit={submit} className="flex flex-col gap-5">
        {/* ------------------------------------------------------ kind */}
        <fieldset>
          <legend className="eyebrow mb-2">What is it</legend>
          <div className="flex flex-wrap gap-1.5">
            {KINDS.map((option) => {
              const Icon = option.icon
              const selected = kind === option.id
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setKind(option.id)}
                  className={cn(
                    'inline-flex h-9 items-center gap-2 rounded-pill px-3.5 text-sm font-medium',
                    'transition-colors duration-fast ease-out-soft',
                    selected
                      ? 'bg-inverse text-on-inverse'
                      : 'bg-raised text-ink-muted shadow-xs hover:text-ink',
                  )}
                >
                  <Icon size={14} aria-hidden />
                  {option.label}
                </button>
              )
            })}
          </div>
          <p className="mt-2 text-xs text-ink-muted">
            {KINDS.find((k) => k.id === kind)?.hint}
          </p>
        </fieldset>

        {/* ----------------------------------------------------- image */}
        {kind === 'image' && (
          <div className="flex flex-col gap-3">
            <Select
              label="Library"
              value={set}
              onChange={(e) => {
                setSet(e.target.value as PhotoSet)
                setPickedIndex(0)
              }}
              options={Object.keys(PHOTO_SETS).map((key) => ({
                value: key,
                label: key.charAt(0).toUpperCase() + key.slice(1),
              }))}
              hint="A curated set stands in for an upload — see the README."
            />
            <fieldset>
              <legend className="eyebrow mb-2">Pick one</legend>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                {PHOTO_SETS[set].map((id, index) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={index === pickedIndex}
                    aria-label={`Image ${index + 1} of ${PHOTO_SETS[set].length}`}
                    onClick={() => setPickedIndex(index)}
                    className={cn(
                      'aspect-square overflow-hidden rounded-lg transition-[box-shadow,transform] duration-fast',
                      index === pickedIndex
                        ? 'shadow-glow-lime ring-2 ring-ink'
                        : 'opacity-80 hover:opacity-100',
                    )}
                  >
                    <img
                      src={photo(id, 'thumb')}
                      alt=""
                      loading="lazy"
                      className="size-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </fieldset>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={asMaterial}
                onChange={(e) => setAsMaterial(e.target.checked)}
                className="size-4 accent-[#0a0a0a]"
              />
              Tag this as a material or texture
            </label>
          </div>
        )}

        {/* ---------------------------------------------------- colour */}
        {kind === 'color' && (
          <div className="flex flex-col gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Hex" htmlFor="mood-hex">
                <div className="flex items-center gap-2">
                  <input
                    id="mood-hex-picker"
                    type="color"
                    value={/^#[0-9a-fA-F]{6}$/.test(hex) ? hex : '#c7f33c'}
                    onChange={(e) => setHex(e.target.value)}
                    aria-label="Pick a colour"
                    className="size-11 shrink-0 cursor-pointer rounded-lg border-0 bg-transparent p-0"
                  />
                  <input
                    id="mood-hex"
                    value={hex}
                    onChange={(e) => setHex(e.target.value)}
                    className="tabular h-11 w-full rounded-lg bg-raised px-3.5 text-base uppercase shadow-xs"
                  />
                </div>
              </Field>
              <Input
                label="Name"
                placeholder="Wet moss"
                value={colorName}
                onChange={(e) => setColorName(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_COLORS.map((swatch) => (
                <button
                  key={swatch.hex}
                  type="button"
                  onClick={() => {
                    setHex(swatch.hex)
                    setColorName(swatch.name)
                  }}
                  className="h-8 rounded-pill px-3 text-xs font-medium shadow-xs transition-transform duration-fast hover:scale-105"
                  style={{ backgroundColor: swatch.hex, color: readableOn(swatch.hex) }}
                >
                  {swatch.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------ type */}
        {kind === 'type' && (
          <div className="flex flex-col gap-3">
            <Select
              label="Typeface"
              value={String(stackIndex)}
              onChange={(e) => setStackIndex(Number(e.target.value))}
              options={TYPE_STACKS.map((t, i) => ({ value: String(i), label: t.family }))}
            />
            <Input
              label="Specimen"
              placeholder="Quiet Objects"
              value={sample}
              onChange={(e) => setSample(e.target.value)}
              required
            />
            <Input
              label="How it should be used"
              placeholder="End card only. Set large, set once."
              value={usage}
              onChange={(e) => setUsage(e.target.value)}
            />
            {sample && (
              <div className="rounded-xl bg-surface p-5">
                <p className="eyebrow mb-2">Preview</p>
                <p
                  className="truncate text-3xl leading-none"
                  style={{
                    fontFamily: TYPE_STACKS[stackIndex].stack,
                    fontWeight: TYPE_STACKS[stackIndex].weight,
                  }}
                >
                  {sample}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------ link */}
        {kind === 'link' && (
          <div className="flex flex-col gap-3">
            <Input
              label="URL"
              type="url"
              placeholder="https://"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
            <Input
              label="Title"
              placeholder="What is worth remembering about it"
              value={linkTitle}
              onChange={(e) => setLinkTitle(e.target.value)}
            />
            {url && (
              <p className="text-xs text-ink-muted">
                Will show as <Pill size="sm">{safeHost(url)}</Pill>
              </p>
            )}
          </div>
        )}

        {/* ------------------------------------------------------ note */}
        {kind === 'note' && (
          <Textarea
            label="Note"
            placeholder="“If it looks like a catalogue we have failed.”"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            required
          />
        )}

        <Input
          label="Caption"
          placeholder="Why this is here"
          hint="Optional, but future-you will thank present-you."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />

        <Select
          label="Section"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          options={sections.map((s) => ({ value: s.id, label: s.title }))}
        />

        <div className="mt-1 flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={!valid}>
            Add reference
          </Button>
        </div>
      </form>
    </Sheet>
  )
}

/** Hostname without the protocol, falling back to a hashed label for bad input. */
function safeHost(value: string): string {
  try {
    return new URL(value.startsWith('http') ? value : `https://${value}`).hostname.replace(
      /^www\./,
      '',
    )
  } catch {
    return `link-${hashCode(value) % 1000}`
  }
}
