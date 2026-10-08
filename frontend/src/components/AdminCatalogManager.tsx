import { FormEvent, useState } from 'react'
import { deleteAdminCatalog, saveAdminCatalog } from '../api/client'
import type { AdminCatalog } from '../types'

type Kind = 'airlines' | 'airports' | 'aircraft' | 'fare-classes' | 'baggage-options'
type Editing = { kind: Kind; id: number; values: Record<string, string | number> } | null

export default function AdminCatalogManager({ catalogs, reload, notify }: {
  catalogs: AdminCatalog
  reload: () => Promise<void>
  notify: (message: string, error?: boolean) => void
}) {
  const [editing, setEditing] = useState<Editing>(null)

  async function submit(kind: Kind, event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const raw = Object.fromEntries(new FormData(form).entries())
    const payload: Record<string, string | number> = Object.fromEntries(
      Object.entries(raw).map(([key, value]) => [key, ['seatCapacity', 'airlineId', 'cabinBaggageKg', 'includedCheckedBaggageKg', 'weightKg', 'price'].includes(key) ? Number(value) : String(value)]),
    )
    try {
      await saveAdminCatalog(kind, payload, editing?.kind === kind ? editing.id : undefined)
      setEditing(null); form.reset(); notify('Đã lưu danh mục hệ thống.'); await reload()
    } catch (reason) { notify(reason instanceof Error ? reason.message : 'Không thể lưu danh mục', true) }
  }

  async function remove(kind: Kind, id: number) {
    if (!window.confirm('Xóa mục này khỏi hệ thống?')) return
    try { await deleteAdminCatalog(kind, id); notify('Đã xóa mục khỏi danh mục.'); await reload() }
    catch (reason) { notify(reason instanceof Error ? reason.message : 'Không thể xóa mục đang được sử dụng', true) }
  }

  const active = (kind: Kind) => editing?.kind === kind ? editing.values : {}
  const edit = (kind: Kind, id: number, values: Record<string, string | number>) => { setEditing({ kind, id, values }); document.querySelector('#catalogs')?.scrollIntoView({ behavior: 'smooth' }) }

  return <div className="catalog-manager">
    <CatalogSection title="Hãng hàng không" count={catalogs.airlines.length}>
      <form key={`airline-${editing?.kind === 'airlines' ? editing.id : 'new'}`} onSubmit={event => submit('airlines', event)}>
        <input name="name" required placeholder="Tên hãng" defaultValue={active('airlines').name ?? ''} />
        <input name="iataCode" required maxLength={3} placeholder="Mã IATA" defaultValue={active('airlines').iataCode ?? ''} />
        <input name="country" placeholder="Quốc gia" defaultValue={active('airlines').country ?? 'Việt Nam'} />
        <input name="cabinBaggageKg" required type="number" min="0" max="30" placeholder="Xách tay (kg)" defaultValue={active('airlines').cabinBaggageKg ?? 7} />
        <input name="includedCheckedBaggageKg" required type="number" min="0" max="100" placeholder="Ký gửi miễn phí (kg)" defaultValue={active('airlines').includedCheckedBaggageKg ?? 0} />
        <CatalogButtons editing={editing?.kind === 'airlines'} cancel={() => setEditing(null)} />
      </form>
      {catalogs.airlines.map(item => <CatalogRow key={item.id} title={`${item.iataCode} · ${item.name}`} detail={`${item.country ?? '—'} · Xách tay ${item.cabinBaggageKg} kg · Ký gửi kèm ${item.includedCheckedBaggageKg} kg`} edit={() => edit('airlines', item.id, { name: item.name, iataCode: item.iataCode, country: item.country ?? '', cabinBaggageKg: item.cabinBaggageKg, includedCheckedBaggageKg: item.includedCheckedBaggageKg })} remove={() => remove('airlines', item.id)} />)}
    </CatalogSection>

    <CatalogSection title="Gói hành lý ký gửi" count={catalogs.baggageOptions.length}>
      <form key={`baggage-${editing?.kind === 'baggage-options' ? editing.id : 'new'}`} onSubmit={event => submit('baggage-options', event)}>
        <select name="airlineId" required defaultValue={active('baggage-options').airlineId ?? ''}><option value="" disabled>Chọn hãng</option>{catalogs.airlines.map(item => <option key={item.id} value={item.id}>{item.iataCode} · {item.name}</option>)}</select>
        <input name="weightKg" required type="number" min="1" max="100" placeholder="Khối lượng (kg)" defaultValue={active('baggage-options').weightKg ?? ''} />
        <input name="price" required type="number" min="0" step="1000" placeholder="Giá bán (VND)" defaultValue={active('baggage-options').price ?? ''} />
        <CatalogButtons editing={editing?.kind === 'baggage-options'} cancel={() => setEditing(null)} />
      </form>
      {catalogs.baggageOptions.map(item => <CatalogRow key={item.id} title={`${item.airlineName} · ${item.weightKg} kg`} detail={`${new Intl.NumberFormat('vi-VN').format(item.price)} ₫`} edit={() => edit('baggage-options', item.id, { airlineId: item.airlineId, weightKg: item.weightKg, price: item.price })} remove={() => remove('baggage-options', item.id)} />)}
    </CatalogSection>

    <CatalogSection title="Sân bay" count={catalogs.airports.length}>
      <form key={`airport-${editing?.kind === 'airports' ? editing.id : 'new'}`} onSubmit={event => submit('airports', event)}>
        <input name="name" required placeholder="Tên sân bay" defaultValue={active('airports').name ?? ''} />
        <input name="iataCode" required maxLength={3} placeholder="Mã IATA" defaultValue={active('airports').iataCode ?? ''} />
        <input name="city" required placeholder="Thành phố" defaultValue={active('airports').city ?? ''} />
        <input name="country" required placeholder="Quốc gia" defaultValue={active('airports').country ?? 'Việt Nam'} />
        <input name="timezone" required placeholder="Múi giờ" defaultValue={active('airports').timezone ?? 'Asia/Ho_Chi_Minh'} />
        <CatalogButtons editing={editing?.kind === 'airports'} cancel={() => setEditing(null)} />
      </form>
      {catalogs.airports.map(item => <CatalogRow key={item.id} title={`${item.iataCode} · ${item.city}`} detail={item.name} edit={() => edit('airports', item.id, { name: item.name, iataCode: item.iataCode, city: item.city, country: item.country, timezone: item.timezone })} remove={() => remove('airports', item.id)} />)}
    </CatalogSection>

    <CatalogSection title="Máy bay" count={catalogs.aircraft.length}>
      <form key={`aircraft-${editing?.kind === 'aircraft' ? editing.id : 'new'}`} onSubmit={event => submit('aircraft', event)}>
        <input name="registrationNumber" required placeholder="Số đăng ký" defaultValue={active('aircraft').registrationNumber ?? ''} />
        <input name="model" required placeholder="Dòng máy bay" defaultValue={active('aircraft').model ?? ''} />
        <input name="seatCapacity" required type="number" min="1" placeholder="Sức chứa" defaultValue={active('aircraft').seatCapacity ?? ''} />
        <select name="airlineId" required defaultValue={active('aircraft').airlineId ?? ''}><option value="" disabled>Chọn hãng</option>{catalogs.airlines.map(item => <option key={item.id} value={item.id}>{item.iataCode} · {item.name}</option>)}</select>
        <CatalogButtons editing={editing?.kind === 'aircraft'} cancel={() => setEditing(null)} />
      </form>
      {catalogs.aircraft.map(item => <CatalogRow key={item.id} title={`${item.registrationNumber} · ${item.model}`} detail={`${item.airlineName} · ${item.seatCapacity} ghế`} edit={() => edit('aircraft', item.id, { registrationNumber: item.registrationNumber, model: item.model, seatCapacity: item.seatCapacity, airlineId: item.airlineId })} remove={() => remove('aircraft', item.id)} />)}
    </CatalogSection>

    <CatalogSection title="Hạng vé" count={catalogs.fareClasses.length}>
      <form key={`fare-${editing?.kind === 'fare-classes' ? editing.id : 'new'}`} onSubmit={event => submit('fare-classes', event)}>
        <input name="code" required placeholder="Mã hạng" defaultValue={active('fare-classes').code ?? ''} />
        <input name="name" required placeholder="Tên hạng" defaultValue={active('fare-classes').name ?? ''} />
        <input name="description" placeholder="Mô tả" defaultValue={active('fare-classes').description ?? ''} />
        <CatalogButtons editing={editing?.kind === 'fare-classes'} cancel={() => setEditing(null)} />
      </form>
      {catalogs.fareClasses.map(item => <CatalogRow key={item.id} title={`${item.code} · ${item.name}`} detail={item.description ?? 'Chưa có mô tả'} edit={() => edit('fare-classes', item.id, { code: item.code, name: item.name, description: item.description ?? '' })} remove={() => remove('fare-classes', item.id)} />)}
    </CatalogSection>
  </div>
}

function CatalogSection({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return <article className="catalog-section"><header><strong>{title}</strong><span>{count} mục</span></header>{children}</article>
}

function CatalogButtons({ editing, cancel }: { editing: boolean; cancel: () => void }) {
  return <div className="catalog-form-actions"><button className="button primary" type="submit">{editing ? 'Lưu' : 'Thêm'}</button>{editing && <button type="button" onClick={cancel}>Hủy</button>}</div>
}

function CatalogRow({ title, detail, edit, remove }: { title: string; detail: string; edit: () => void; remove: () => void }) {
  return <div className="catalog-row"><div><strong>{title}</strong><small>{detail}</small></div><span><button type="button" onClick={edit}>Sửa</button><button className="danger" type="button" onClick={remove}>Xóa</button></span></div>
}
