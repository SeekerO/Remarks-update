// lib/utils/metadata.ts
import { ImageMetadata } from '../../components/Metadatainjector';

// ─────────────────────────────────────────────────────────────────
// 1. Build XMP XML string
//    Readable by: Lightroom, Bridge, Windows Explorer, macOS Preview,
//    ExifTool, and all IPTC-compliant software
// ─────────────────────────────────────────────────────────────────
export function buildXmpString(meta: ImageMetadata): string {
    const now = new Date().toISOString();
    const esc = (s: string) => s
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const keywordsXml = meta.keywords
        ? `<dc:subject><rdf:Bag>${meta.keywords.split(',').map(k =>
            `<rdf:li>${esc(k.trim())}</rdf:li>`).join('')}</rdf:Bag></dc:subject>`
        : '';

    const customFields = [
        meta.customField1Key && meta.customField1Value
            ? `<xmp:${esc(meta.customField1Key.replace(/\s+/g, '_'))}>${esc(meta.customField1Value)}</xmp:${esc(meta.customField1Key.replace(/\s+/g, '_'))}>`
            : '',
        meta.customField2Key && meta.customField2Value
            ? `<xmp:${esc(meta.customField2Key.replace(/\s+/g, '_'))}>${esc(meta.customField2Value)}</xmp:${esc(meta.customField2Key.replace(/\s+/g, '_'))}>`
            : '',
    ].filter(Boolean).join('');

    return `<?xpacket begin="\uFEFF" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about=""
      xmlns:dc="http://purl.org/dc/elements/1.1/"
      xmlns:xmp="http://ns.adobe.com/xap/1.0/"
      xmlns:xmpRights="http://ns.adobe.com/xap/1.0/rights/"
      xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/"
      xmlns:Iptc4xmpCore="http://iptc.org/std/Iptc4xmpCore/1.0/xmlns/">

      ${meta.title ? `<dc:title><rdf:Alt><rdf:li xml:lang="x-default">${esc(meta.title)}</rdf:li></rdf:Alt></dc:title>` : ''}
      ${meta.description ? `<dc:description><rdf:Alt><rdf:li xml:lang="x-default">${esc(meta.description)}</rdf:li></rdf:Alt></dc:description>` : ''}
      ${meta.author ? `<dc:creator><rdf:Seq><rdf:li>${esc(meta.author)}</rdf:li></rdf:Seq></dc:creator>` : ''}
      ${meta.copyright ? `<dc:rights><rdf:Alt><rdf:li xml:lang="x-default">${esc(meta.copyright)}</rdf:li></rdf:Alt></dc:rights>` : ''}
      ${keywordsXml}

      ${meta.software ? `<xmp:CreatorTool>${esc(meta.software)}</xmp:CreatorTool>` : ''}
      <xmp:CreateDate>${now}</xmp:CreateDate>
      <xmp:MetadataDate>${now}</xmp:MetadataDate>
      ${customFields}

      ${meta.copyright ? `<xmpRights:Marked>True</xmpRights:Marked>` : ''}
      ${meta.copyright ? `<xmpRights:UsageTerms><rdf:Alt><rdf:li xml:lang="x-default">${esc(meta.copyright)}</rdf:li></rdf:Alt></xmpRights:UsageTerms>` : ''}
      ${meta.website ? `<xmpRights:WebStatement>${esc(meta.website)}</xmpRights:WebStatement>` : ''}

      ${meta.author ? `<photoshop:Author>${esc(meta.author)}</photoshop:Author>` : ''}
      ${meta.organization ? `<photoshop:Credit>${esc(meta.organization)}</photoshop:Credit>` : ''}
      ${meta.copyright ? `<photoshop:CopyrightFlag>True</photoshop:CopyrightFlag>` : ''}
      ${meta.title ? `<photoshop:Headline>${esc(meta.title)}</photoshop:Headline>` : ''}
      ${meta.website ? `<photoshop:Source>${esc(meta.website)}</photoshop:Source>` : ''}

      ${meta.organization || meta.website ? `
      <Iptc4xmpCore:CreatorContactInfo><rdf:Description>
        ${meta.organization ? `<Iptc4xmpCore:CiEmailWork>${esc(meta.organization)}</Iptc4xmpCore:CiEmailWork>` : ''}
        ${meta.website ? `<Iptc4xmpCore:CiUrlWork>${esc(meta.website)}</Iptc4xmpCore:CiUrlWork>` : ''}
      </rdf:Description></Iptc4xmpCore:CreatorContactInfo>` : ''}

    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
}

// ─────────────────────────────────────────────────────────────────
// 2. Plain comment string (human-readable fallback)
// ─────────────────────────────────────────────────────────────────
export function buildMetadataComment(meta: ImageMetadata): string {
    const lines: string[] = ['[Avexi Watermark Metadata]'];
    const add = (k: string, v: string) => { if (v.trim()) lines.push(`${k}: ${v.trim()}`); };
    add('Title', meta.title);
    add('Author', meta.author);
    add('Copyright', meta.copyright);
    add('Description', meta.description);
    add('Keywords', meta.keywords);
    add('Organization', meta.organization);
    add('Website', meta.website);
    add('Software', meta.software);
    add('Created', new Date().toISOString());
    if (meta.customField1Key && meta.customField1Value) add(meta.customField1Key, meta.customField1Value);
    if (meta.customField2Key && meta.customField2Value) add(meta.customField2Key, meta.customField2Value);
    return lines.join('\n');
}

// ─────────────────────────────────────────────────────────────────
// 3. Main injection entry point
// ─────────────────────────────────────────────────────────────────
export async function injectMetadataIntoBlob(
    blob: Blob,
    meta: ImageMetadata,
    format: 'png' | 'jpg' | 'webp' = 'png'
): Promise<Blob> {
    if (!meta.enabled) return blob;
    const buf = await blob.arrayBuffer();
    if (format === 'png') return injectPngMetadata(buf, meta);
    if (format === 'jpg') return injectJpegMetadata(buf, meta);
    return blob; // WebP: no standard comment injection support in browser
}

// ─────────────────────────────────────────────────────────────────
// 4. PNG: inject tEXt + iTXt(XMP) chunks after IHDR
//    tEXt → "Title", "Author", "Copyright", "Description", "Comment"
//    iTXt → full XMP block (Adobe/IPTC standard)
// ─────────────────────────────────────────────────────────────────
function injectPngMetadata(buf: ArrayBuffer, meta: ImageMetadata): Blob {
    const original = new Uint8Array(buf);
    const chunks: Uint8Array[] = [];

    // Individual tEXt chunks — readable by basic image tools
    const textFields: [string, string][] = ([
        ['Title', meta.title],
        ['Author', meta.author],
        ['Copyright', meta.copyright],
        ['Description', meta.description],
        ['Software', meta.software],
        ['Comment', buildMetadataComment(meta)],
    ] as [string, string][]).filter(([, v]) => v.trim() !== '');

    for (const [keyword, text] of textFields) {
        chunks.push(buildPngTextChunk(keyword, text));
    }

    // iTXt chunk with XMP — read by Lightroom, ExifTool, Bridge
    chunks.push(buildPngXmpChunk(buildXmpString(meta)));

    // Insert after IHDR (always ends at byte 33)
    const IHDR_END = 33;
    const before = original.slice(0, IHDR_END);
    const after = original.slice(IHDR_END);
    const totalChunkSize = chunks.reduce((sum, c) => sum + c.length, 0);

    const combined = new Uint8Array(before.length + totalChunkSize + after.length);
    let offset = 0;
    combined.set(before, offset); offset += before.length;
    for (const chunk of chunks) { combined.set(chunk, offset); offset += chunk.length; }
    combined.set(after, offset);

    return new Blob([combined], { type: 'image/png' });
}

function buildPngTextChunk(keyword: string, text: string): Uint8Array {
    const enc = new TextEncoder();
    const kb = enc.encode(keyword);
    const tb = enc.encode(text);
    const data = new Uint8Array(kb.length + 1 + tb.length);
    data.set(kb);
    data[kb.length] = 0;
    data.set(tb, kb.length + 1);
    return assemblePngChunk('tEXt', data);
}

// iTXt: keyword\0 + compression_flag(0) + compression_method(0) + lang\0 + translated_keyword\0 + text
function buildPngXmpChunk(xmp: string): Uint8Array {
    const enc = new TextEncoder();
    const keyword = enc.encode('XML:com.adobe.xmp');
    const xmpBytes = enc.encode(xmp);
    const data = new Uint8Array(keyword.length + 5 + xmpBytes.length);
    let o = 0;
    data.set(keyword, o); o += keyword.length;
    data[o++] = 0; // null terminator after keyword
    data[o++] = 0; // compression flag: 0 = not compressed
    data[o++] = 0; // compression method
    data[o++] = 0; // language tag (empty string, null terminated)
    data[o++] = 0; // translated keyword (empty string, null terminated)
    data.set(xmpBytes, o);
    return assemblePngChunk('iTXt', data);
}

function assemblePngChunk(type: string, data: Uint8Array): Uint8Array {
    const enc = new TextEncoder();
    const typeBytes = enc.encode(type);
    const chunk = new Uint8Array(4 + 4 + data.length + 4);
    const view = new DataView(chunk.buffer);
    view.setUint32(0, data.length, false);
    chunk.set(typeBytes, 4);
    chunk.set(data, 8);
    const crcInput = new Uint8Array(typeBytes.length + data.length);
    crcInput.set(typeBytes);
    crcInput.set(data, typeBytes.length);
    view.setUint32(8 + data.length, crc32(crcInput), false);
    return chunk;
}

// ─────────────────────────────────────────────────────────────────
// 5. JPEG: inject APP1(XMP) + APP1(EXIF) + COM after SOI
//    APP1 XMP  → full XMP block (Adobe/IPTC standard)
//    APP1 EXIF → Artist, Copyright, ImageDescription tags
//    COM       → human-readable comment fallback
// ─────────────────────────────────────────────────────────────────
function injectJpegMetadata(buf: ArrayBuffer, meta: ImageMetadata): Blob {
    const original = new Uint8Array(buf);
    const segments: Uint8Array[] = [];

    segments.push(buildJpegXmpSegment(buildXmpString(meta)));

    const exif = buildMinimalExif(meta);
    if (exif) segments.push(exif);

    segments.push(buildJpegComSegment(buildMetadataComment(meta)));

    const totalSize = segments.reduce((s, seg) => s + seg.length, 0);
    const combined = new Uint8Array(2 + totalSize + (original.length - 2));
    let offset = 0;
    combined.set(original.slice(0, 2), offset); offset += 2;
    for (const seg of segments) { combined.set(seg, offset); offset += seg.length; }
    combined.set(original.slice(2), offset);

    return new Blob([combined], { type: 'image/jpeg' });
}

// FF E1 + length + "http://ns.adobe.com/xap/1.0/\0" + XMP
function buildJpegXmpSegment(xmp: string): Uint8Array {
    const enc = new TextEncoder();
    const ns = enc.encode('http://ns.adobe.com/xap/1.0/\0');
    const xmpBytes = enc.encode(xmp);
    const data = new Uint8Array(ns.length + xmpBytes.length);
    data.set(ns);
    data.set(xmpBytes, ns.length);
    const segLen = 2 + data.length;
    const seg = new Uint8Array(4 + data.length);
    seg[0] = 0xFF; seg[1] = 0xE1;
    seg[2] = (segLen >> 8) & 0xFF; seg[3] = segLen & 0xFF;
    seg.set(data, 4);
    return seg;
}

// FF FE + length + text
function buildJpegComSegment(text: string): Uint8Array {
    const enc = new TextEncoder();
    const tb = enc.encode(text);
    const segLen = 2 + tb.length;
    const seg = new Uint8Array(4 + tb.length);
    seg[0] = 0xFF; seg[1] = 0xFE;
    seg[2] = (segLen >> 8) & 0xFF; seg[3] = segLen & 0xFF;
    seg.set(tb, 4);
    return seg;
}

// Minimal EXIF IFD0 with Artist (0x013B), Copyright (0x8298), ImageDescription (0x010E)
function buildMinimalExif(meta: ImageMetadata): Uint8Array | null {
    if (!meta.author && !meta.copyright && !meta.description) return null;

    const enc = new TextEncoder();
    const EXIF_HEADER = new Uint8Array([0x45, 0x78, 0x69, 0x66, 0x00, 0x00]); // "Exif\0\0"
    // Little-endian TIFF header: "II" + 42 + IFD0 offset (8)
    const TIFF_HEADER = new Uint8Array([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00]);

    const fields: Array<{ tag: number; value: string }> = [];
    if (meta.description) fields.push({ tag: 0x010E, value: meta.description });
    if (meta.author)      fields.push({ tag: 0x013B, value: meta.author });
    if (meta.copyright)   fields.push({ tag: 0x8298, value: meta.copyright });
    fields.sort((a, b) => a.tag - b.tag); // EXIF requires ascending tag order

    const numFields = fields.length;
    const ifdSize = 2 + numFields * 12 + 4;
    const valueAreaStart = 8 + ifdSize; // relative to start of TIFF data

    const valueBuffers = fields.map(f => enc.encode(f.value + '\0'));
    const totalValueSize = valueBuffers.reduce((s, b) => s + b.length, 0);

    const tiffData = new Uint8Array(8 + ifdSize + totalValueSize);
    tiffData.set(TIFF_HEADER, 0);

    const view = new DataView(tiffData.buffer);
    view.setUint16(8, numFields, true); // IFD entry count

    let currentValueOffset = valueAreaStart;
    fields.forEach((field, i) => {
        const base = 10 + i * 12;
        const vb = valueBuffers[i];
        view.setUint16(base, field.tag, true);
        view.setUint16(base + 2, 2, true); // ASCII type
        view.setUint32(base + 4, vb.length, true);
        if (vb.length <= 4) {
            tiffData.set(vb, base + 8);
        } else {
            view.setUint32(base + 8, currentValueOffset, true);
            tiffData.set(vb, currentValueOffset);
            currentValueOffset += vb.length;
        }
    });
    view.setUint32(10 + numFields * 12, 0, true); // next IFD = 0

    const segData = new Uint8Array(EXIF_HEADER.length + tiffData.length);
    segData.set(EXIF_HEADER);
    segData.set(tiffData, EXIF_HEADER.length);

    const segLen = 2 + segData.length;
    const seg = new Uint8Array(4 + segData.length);
    seg[0] = 0xFF; seg[1] = 0xE1;
    seg[2] = (segLen >> 8) & 0xFF; seg[3] = segLen & 0xFF;
    seg.set(segData, 4);
    return seg;
}

// ─────────────────────────────────────────────────────────────────
// 6. CRC-32 (required for PNG chunk integrity)
// ─────────────────────────────────────────────────────────────────
function crc32(data: Uint8Array): number {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < data.length; i++) {
        crc ^= data[i];
        for (let j = 0; j < 8; j++) {
            crc = crc & 1 ? (crc >>> 1) ^ 0xEDB88320 : crc >>> 1;
        }
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
}

// ─────────────────────────────────────────────────────────────────
// 7. Text watermark — renders visible text directly on canvas
// ─────────────────────────────────────────────────────────────────
export function applyTextWatermark(canvas: HTMLCanvasElement, meta: ImageMetadata): void {
    if (!meta.enabled || !meta.textWatermark.enabled) return;
    const tw = meta.textWatermark;
    const text = tw.text.trim() || buildAutoText(meta);
    if (!text) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const fontSize = Math.max(10, Math.min(tw.fontSize * (canvas.width / 800), canvas.width * 0.05));
    ctx.save();
    ctx.font = `bold ${fontSize}px "Inter", "Helvetica Neue", sans-serif`;

    const textW = ctx.measureText(text).width;
    const padX = fontSize * 0.6;
    const padY = fontSize * 0.4;
    const boxW = textW + padX * 2;
    const boxH = fontSize + padY * 2;
    const margin = fontSize * 0.8;

    let x = 0, y = 0;
    switch (tw.position) {
        case 'top-left':      x = margin; y = margin; break;
        case 'top-right':     x = canvas.width - boxW - margin; y = margin; break;
        case 'bottom-left':   x = margin; y = canvas.height - boxH - margin; break;
        case 'bottom-center': x = (canvas.width - boxW) / 2; y = canvas.height - boxH - margin; break;
        case 'bottom-right':
        default:              x = canvas.width - boxW - margin; y = canvas.height - boxH - margin; break;
    }

    if (tw.bgOpacity > 0) {
        const r = parseInt(tw.bgColor.slice(1, 3), 16);
        const g = parseInt(tw.bgColor.slice(3, 5), 16);
        const b = parseInt(tw.bgColor.slice(5, 7), 16);
        ctx.globalAlpha = tw.bgOpacity;
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        const rad = boxH * 0.35;
        ctx.beginPath();
        ctx.moveTo(x + rad, y);
        ctx.lineTo(x + boxW - rad, y);
        ctx.arcTo(x + boxW, y, x + boxW, y + rad, rad);
        ctx.lineTo(x + boxW, y + boxH - rad);
        ctx.arcTo(x + boxW, y + boxH, x + boxW - rad, y + boxH, rad);
        ctx.lineTo(x + rad, y + boxH);
        ctx.arcTo(x, y + boxH, x, y + boxH - rad, rad);
        ctx.lineTo(x, y + rad);
        ctx.arcTo(x, y, x + rad, y, rad);
        ctx.closePath();
        ctx.fill();
    }

    ctx.globalAlpha = tw.opacity;
    ctx.fillStyle = tw.color;
    ctx.textBaseline = 'top';
    ctx.fillText(text, x + padX, y + padY);
    ctx.restore();
}

function buildAutoText(meta: ImageMetadata): string {
    const parts: string[] = [];
    if (meta.copyright) parts.push(`© ${meta.copyright}`);
    else if (meta.author) parts.push(`© ${meta.author}`);
    if (meta.website) parts.push(meta.website);
    return parts.join(' · ');
}