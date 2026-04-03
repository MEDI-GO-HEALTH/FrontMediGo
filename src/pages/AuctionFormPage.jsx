import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuctionDetail } from '../hooks/useAuctionDetail';
import { useCreateAuction, useUpdateAuction } from '../hooks/useAuctionMutations';
import { isAdmin } from '../lib/auth';

/**
 * Screen 3: Create / Edit Auction (ADMIN only)
 *
 * Create mode: POST /api/auctions — full form including closureType, maxPrice, inactivityMinutes
 * Edit mode:   PUT /api/auctions/{id} — only basePrice, startTime, endTime
 *              (ONLY allowed when status === 'SCHEDULED')
 *
 * Business rule validations reflected in the form:
 *   - startTime >= now
 *   - endTime > startTime
 *   - basePrice > 0
 *   - maxPrice required when closureType === MAX_PRICE
 *   - inactivityMinutes required when closureType === INACTIVITY
 */
export default function AuctionFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  // All hooks must be called unconditionally before any early returns
  const { data: detail, isLoading: loadingDetail } = useAuctionDetail(isEdit ? id : null);

  const [form, setForm] = useState({
    medicationId: '',
    branchId: '',
    basePrice: '',
    startTime: '',
    endTime: '',
    closureType: 'FIXED_TIME',
    maxPrice: '',
    inactivityMinutes: '',
  });
  const [validationError, setValidationError] = useState(null);

  const { mutate: doCreate, isPending: creating, error: createError } = useCreateAuction({
    onSuccess: (data) => navigate(`/auctions/${data?.id ?? ''}`),
  });

  const { mutate: doUpdate, isPending: updating, error: updateError } = useUpdateAuction(id, {
    onSuccess: () => navigate(`/auctions/${id}`),
  });

  const auction = detail?.auction;

  // Populate form once when auction data arrives in edit mode.
  useEffect(() => {
    if (isEdit && auction) {
      setForm({
        medicationId: String(auction.medicationId ?? ''),
        branchId: String(auction.branchId ?? ''),
        basePrice: String(auction.basePrice ?? ''),
        startTime: toDatetimeLocal(auction.startTime),
        endTime: toDatetimeLocal(auction.endTime),
        closureType: auction.closureType ?? 'FIXED_TIME',
        maxPrice: String(auction.maxPrice ?? ''),
        inactivityMinutes: String(auction.inactivityMinutes ?? ''),
      });
    }
    // Run only when auction entity changes (new load or data update)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auction?.id]);

  // ── Early returns (after all hooks) ─────────────────────────────────────────

  if (!isAdmin()) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-red-600 font-medium">
          Acceso restringido. Solo los administradores pueden crear o editar subastas.
        </p>
        <button onClick={() => navigate('/auctions')} className="mt-4 text-sm text-indigo-600 hover:underline">
          Volver al listado
        </button>
      </div>
    );
  }

  if (isEdit && loadingDetail) {
    return <div className="mx-auto max-w-xl px-4 py-8 text-sm text-slate-500">Cargando...</div>;
  }

  const isEditable = !isEdit || auction?.status === 'SCHEDULED';
  if (isEdit && !isEditable) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-amber-700 font-medium">
          Esta subasta ya no puede editarse (estado: {auction?.status}).
          Solo se pueden editar subastas en estado PROGRAMADA.
        </p>
        <button onClick={() => navigate(`/auctions/${id}`)} className="mt-4 text-sm text-indigo-600 hover:underline">
          Ver detalle
        </button>
      </div>
    );
  }

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const isPending = creating || updating;
  const serverError = createError?.displayMessage || updateError?.displayMessage;
  const displayError = validationError || serverError;

  function setField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setValidationError(null);
  }

  function validate() {
    const now   = new Date();
    const start = new Date(form.startTime);
    const end   = new Date(form.endTime);
    const price = parseFloat(form.basePrice);

    if (!form.startTime) return 'La fecha de inicio es requerida.';
    if (start < now) return 'La fecha de inicio debe ser en el futuro.';
    if (!form.endTime) return 'La fecha de fin es requerida.';
    if (end <= start) return 'La fecha de fin debe ser posterior a la de inicio.';
    if (isNaN(price) || price <= 0) return 'El precio base debe ser un número positivo.';
    if (!isEdit) {
      if (!form.medicationId) return 'El ID del medicamento es requerido.';
      if (!form.branchId) return 'El ID de la sucursal es requerida.';
      if (form.closureType === 'MAX_PRICE' && !form.maxPrice)
        return 'El precio máximo es requerido para cierre por precio máximo.';
      if (form.closureType === 'INACTIVITY' && !form.inactivityMinutes)
        return 'Los minutos de inactividad son requeridos para cierre por inactividad.';
    }
    return null;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const err = validate();
    if (err) { setValidationError(err); return; }

    if (isEdit) {
      doUpdate({
        basePrice: parseFloat(form.basePrice),
        startTime: form.startTime,
        endTime: form.endTime,
      });
    } else {
      const payload = {
        medicationId: Number(form.medicationId),
        branchId: Number(form.branchId),
        basePrice: parseFloat(form.basePrice),
        startTime: form.startTime,
        endTime: form.endTime,
        closureType: form.closureType,
      };
      if (form.closureType === 'MAX_PRICE' && form.maxPrice)
        payload.maxPrice = parseFloat(form.maxPrice);
      if (form.closureType === 'INACTIVITY' && form.inactivityMinutes)
        payload.inactivityMinutes = parseInt(form.inactivityMinutes, 10);
      doCreate(payload);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      {/* Back */}
      <button
        onClick={() => navigate(isEdit ? `/auctions/${id}` : '/auctions')}
        className="mb-6 flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft size={15} />
        {isEdit ? 'Volver al detalle' : 'Volver al listado'}
      </button>

      <h1 className="mb-6 text-xl font-bold text-slate-900">
        {isEdit ? 'Editar subasta' : 'Nueva subasta'}
      </h1>

      {isEdit && (
        <div className="mb-4 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          En edición solo puedes modificar el precio base, la fecha de inicio y la fecha de fin.
        </div>
      )}

      {displayError && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
          <span>{displayError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {/* Create-only fields */}
        {!isEdit && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Field label="ID Medicamento *" htmlFor="medicationId">
                <input
                  id="medicationId"
                  type="number"
                  min="1"
                  value={form.medicationId}
                  onChange={(e) => setField('medicationId', e.target.value)}
                  required
                  className={inputClass}
                  placeholder="ej. 42"
                />
              </Field>
              <Field label="ID Sucursal *" htmlFor="branchId">
                <input
                  id="branchId"
                  type="number"
                  min="1"
                  value={form.branchId}
                  onChange={(e) => setField('branchId', e.target.value)}
                  required
                  className={inputClass}
                  placeholder="ej. 10"
                />
              </Field>
            </div>

            <Field label="Tipo de cierre" htmlFor="closureType">
              <select
                id="closureType"
                value={form.closureType}
                onChange={(e) => setField('closureType', e.target.value)}
                className={inputClass}
              >
                <option value="FIXED_TIME">Tiempo fijo</option>
                <option value="INACTIVITY">Inactividad</option>
                <option value="MAX_PRICE">Precio máximo</option>
              </select>
            </Field>

            {form.closureType === 'MAX_PRICE' && (
              <Field label="Precio máximo *" htmlFor="maxPrice">
                <input
                  id="maxPrice"
                  type="number"
                  min="0.01"
                  step="any"
                  value={form.maxPrice}
                  onChange={(e) => setField('maxPrice', e.target.value)}
                  required
                  className={inputClass}
                  placeholder="ej. 5000"
                />
              </Field>
            )}

            {form.closureType === 'INACTIVITY' && (
              <Field label="Minutos de inactividad *" htmlFor="inactivityMinutes">
                <input
                  id="inactivityMinutes"
                  type="number"
                  min="1"
                  value={form.inactivityMinutes}
                  onChange={(e) => setField('inactivityMinutes', e.target.value)}
                  required
                  className={inputClass}
                  placeholder="ej. 15"
                />
              </Field>
            )}
          </>
        )}

        {/* Common editable fields */}
        <Field label="Precio base *" htmlFor="basePrice">
          <input
            id="basePrice"
            type="number"
            min="0.01"
            step="any"
            value={form.basePrice}
            onChange={(e) => setField('basePrice', e.target.value)}
            required
            className={inputClass}
            placeholder="ej. 1000"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Fecha de inicio *" htmlFor="startTime">
            <input
              id="startTime"
              type="datetime-local"
              value={form.startTime}
              onChange={(e) => setField('startTime', e.target.value)}
              min={toDatetimeLocal(new Date().toISOString())}
              required
              className={inputClass}
            />
          </Field>
          <Field label="Fecha de fin *" htmlFor="endTime">
            <input
              id="endTime"
              type="datetime-local"
              value={form.endTime}
              onChange={(e) => setField('endTime', e.target.value)}
              min={form.startTime || toDatetimeLocal(new Date().toISOString())}
              required
              className={inputClass}
            />
          </Field>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(isEdit ? `/auctions/${id}` : '/auctions')}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white
                       hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear subasta'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, htmlFor, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-xs font-medium text-slate-600">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ' +
  'focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-white';

function toDatetimeLocal(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toISOString().slice(0, 16);
  } catch {
    return String(iso).slice(0, 16);
  }
}
