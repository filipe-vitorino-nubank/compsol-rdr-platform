import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import {
  initialFormState,
  type RdrFormState,
  type Squad,
  type ReasonCs,
  type ReasonInvOps,
  type SubreasonFraudster,
  type SimNao,
} from "../types/form";
import { STORAGE_DRAFT } from "../lib/storageKeys";

/* ── Field-group reset maps ── */

const CLEAR_CS: Partial<RdrFormState> = {
  reasonCs: "",
  cenarioDeviceAuth: "",
  subreasonCs: "",
};

const CLEAR_VICTIM: Partial<RdrFormState> = {
  tipoCliente: "",
  casoMedPix: "",
  transacaoBoleto: "",
  contaFavorecidaFraudster: "",
  subreasonVictim: "",
  statusMed: "",
  devolucao: "",
};

const CLEAR_RP: Partial<RdrFormState> = {
  casosMudbray: "",
  casosCercadinho: "",
  casosBoleto: "",
  tfoConcluidoRp: "",
  contaSemSaldoRp: "",
  tfoParcialRp: "",
  saldoEmContaRp: "",
};

const CLEAR_BC: Partial<RdrFormState> = {
  tfoConcluidoBc: "",
  contaSemSaldoBc: "",
  bcFraudadorPfpj: "",
  bcFraudadorTipo: "",
  tfoParcialBc: "",
  devolucaoOrigemBc: "",
  saldoEmContaBc: "",
};

const CLEAR_FRAUDSTER: Partial<RdrFormState> = {
  possuiDict: "",
  dataDict: "",
  dataNotificacaoCliente: "",
  subreasonFraudster: "",
  ...CLEAR_RP,
  ...CLEAR_BC,
  transacaoCodigo: "",
  transacaoValor: "",
};

const CLEAR_INVOPS: Partial<RdrFormState> = {
  temContaPj: "",
  reasonInvOps: "",
  ...CLEAR_VICTIM,
  ...CLEAR_FRAUDSTER,
};

/* ── Reducer ── */

type FormAction =
  | { type: "PATCH"; payload: Partial<RdrFormState> }
  | { type: "SET_ERRORS"; errors: Record<string, string> }
  | { type: "CLEAR_ERRORS" }
  | { type: "RESET" }
  | { type: "LOAD_DRAFT"; draft: Partial<RdrFormState> };

function reducer(state: RdrFormState, action: FormAction): RdrFormState {
  switch (action.type) {
    case "PATCH": {
      const { fieldErrors: feIn, ...rest } = action.payload;
      const next = { ...state, ...rest } as RdrFormState;
      if (feIn !== undefined) {
        next.fieldErrors = feIn;
      } else {
        const fe = { ...state.fieldErrors };
        for (const k of Object.keys(rest)) delete fe[k];
        next.fieldErrors = fe;
      }
      return next;
    }
    case "SET_ERRORS":
      return { ...state, fieldErrors: { ...action.errors } };
    case "CLEAR_ERRORS":
      return { ...state, fieldErrors: {} };
    case "RESET":
      return { ...initialFormState };
    case "LOAD_DRAFT":
      return { ...initialFormState, ...action.draft, fieldErrors: {} };
    default:
      return state;
  }
}

/* ── Context value ── */

type FormContextValue = {
  state: RdrFormState;
  setField: <K extends keyof RdrFormState>(key: K, value: RdrFormState[K]) => void;
  handleSquadChange: (v: Squad | "") => void;
  handleReasonCsChange: (v: ReasonCs | "") => void;
  handleReasonInvOpsChange: (v: ReasonInvOps | "") => void;
  handleSubreasonFraudsterChange: (v: SubreasonFraudster | "") => void;
  handlePossuiDictChange: (v: SimNao | "") => void;
  setErrors: (errors: Record<string, string>) => void;
  reset: () => void;
};

const FormContext = createContext<FormContextValue | null>(null);

function loadDraft(): Partial<RdrFormState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_DRAFT);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<RdrFormState>;
  } catch {
    return null;
  }
}

export function FormProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialFormState, (base) => {
    const d = loadDraft();
    if (!d) return base;
    return reducer(base, { type: "LOAD_DRAFT", draft: d });
  });

  useEffect(() => {
    const t = window.setTimeout(() => {
      const { fieldErrors: _fe, ...toSave } = state;
      localStorage.setItem(STORAGE_DRAFT, JSON.stringify(toSave));
    }, 400);
    return () => window.clearTimeout(t);
  }, [state]);

  const setField = useCallback(
    <K extends keyof RdrFormState>(key: K, value: RdrFormState[K]) => {
      dispatch({ type: "PATCH", payload: { [key]: value } as Partial<RdrFormState> });
    },
    [],
  );

  const handleSquadChange = useCallback((squad: Squad | "") => {
    if (squad === "Customer Security") {
      dispatch({ type: "PATCH", payload: { squad, ...CLEAR_INVOPS } });
    } else if (squad === "Inv Ops") {
      dispatch({ type: "PATCH", payload: { squad, ...CLEAR_CS } });
    } else {
      dispatch({ type: "PATCH", payload: { squad, ...CLEAR_CS, ...CLEAR_INVOPS } });
    }
  }, []);

  const handleReasonCsChange = useCallback((reasonCs: ReasonCs | "") => {
    dispatch({
      type: "PATCH",
      payload: { reasonCs, cenarioDeviceAuth: "", subreasonCs: "" },
    });
  }, []);

  const handleReasonInvOpsChange = useCallback((reasonInvOps: ReasonInvOps | "") => {
    if (reasonInvOps === "Victim") {
      dispatch({ type: "PATCH", payload: { reasonInvOps, ...CLEAR_FRAUDSTER } });
    } else if (reasonInvOps === "Fraudster") {
      dispatch({ type: "PATCH", payload: { reasonInvOps, ...CLEAR_VICTIM } });
    } else {
      dispatch({
        type: "PATCH",
        payload: { reasonInvOps, ...CLEAR_VICTIM, ...CLEAR_FRAUDSTER },
      });
    }
  }, []);

  const handleSubreasonFraudsterChange = useCallback(
    (subreasonFraudster: SubreasonFraudster | "") => {
      dispatch({
        type: "PATCH",
        payload: {
          subreasonFraudster,
          ...CLEAR_RP,
          ...CLEAR_BC,
          transacaoCodigo: "",
          transacaoValor: "",
        },
      });
    },
    [],
  );

  const handlePossuiDictChange = useCallback((possuiDict: SimNao | "") => {
    const payload: Partial<RdrFormState> = { possuiDict };
    if (possuiDict !== "Sim") payload.dataDict = "";
    dispatch({ type: "PATCH", payload });
  }, []);

  const setErrors = useCallback((errors: Record<string, string>) => {
    dispatch({ type: "SET_ERRORS", errors });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
    localStorage.removeItem(STORAGE_DRAFT);
  }, []);

  const value = useMemo(
    () => ({
      state,
      setField,
      handleSquadChange,
      handleReasonCsChange,
      handleReasonInvOpsChange,
      handleSubreasonFraudsterChange,
      handlePossuiDictChange,
      setErrors,
      reset,
    }),
    [
      state,
      setField,
      handleSquadChange,
      handleReasonCsChange,
      handleReasonInvOpsChange,
      handleSubreasonFraudsterChange,
      handlePossuiDictChange,
      setErrors,
      reset,
    ],
  );

  return <FormContext.Provider value={value}>{children}</FormContext.Provider>;
}

export function useFormContext() {
  const ctx = useContext(FormContext);
  if (!ctx) throw new Error("useFormContext outside FormProvider");
  return ctx;
}
