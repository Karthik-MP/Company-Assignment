from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, Sequence


@dataclass(frozen=True)
class OverconfidenceParams:
    tau: float = 0.9          # threshold (given by prompt)
    p: float = 2.0            # nonlinearity (>= 1; usually > 1)
    lam: float = 1.0          # strength (>= 0)

    def validate(self) -> None:
        if not (0.0 < self.tau < 1.0):
            raise ValueError(f"tau must be in (0,1). Got {self.tau}")
        if self.p < 1.0:
            raise ValueError(f"p must be >= 1. Got {self.p}")
        if self.lam < 0.0:
            raise ValueError(f"lam must be >= 0. Got {self.lam}")


def _validate_confidence(c: float) -> None:
    if not (0.0 <= c <= 1.0):
        raise ValueError(f"confidence must be in [0,1]. Got {c}")


def overconfidence_multiplier(conf: float, params: OverconfidenceParams) -> float:
    """
    Multiplier applied to *a hallucination* with confidence conf.

    - If conf <= tau: multiplier = 1.0 (no extra penalty)
    - If conf > tau: multiplier = 1 + lam * ((conf - tau)/(1 - tau))^p

    Note: caller must ensure this is only used for hallucinations.
    """
    params.validate()
    _validate_confidence(conf)

    if conf <= params.tau:
        return 1.0
    x = (conf - params.tau) / (1.0 - params.tau)  # in (0,1]
    return 1.0 + params.lam * (x ** params.p)


def effective_hallucination_count(
    hallucination_confidences: Iterable[float],
    params: OverconfidenceParams = OverconfidenceParams(),
) -> float:
    """Sum of multipliers over hallucinated examples."""
    return sum(overconfidence_multiplier(c, params) for c in hallucination_confidences)


def score_S(
    N: int,
    hallucination_confidences: Sequence[float],  # confidences ONLY for hallucinated rows
    unjustified_refusals: int,
    params: OverconfidenceParams = OverconfidenceParams(),
    cost_ratio_refusal_to_halluc: float = 1.0 / 20.0,
) -> float:
    """
    S in [0,1] where higher is better.

    NormCost = H_eff/N + (C_UR/C_H) * UR/N
    S = 1 - min(1, NormCost)
    """
    params.validate()
    if N <= 0:
        raise ValueError(f"N must be > 0. Got {N}")
    if unjustified_refusals < 0:
        raise ValueError(f"unjustified_refusals must be >= 0. Got {unjustified_refusals}")
    if not (0.0 <= cost_ratio_refusal_to_halluc):
        raise ValueError(f"cost_ratio_refusal_to_halluc must be >= 0. Got {cost_ratio_refusal_to_halluc}")
    
    # Validate confidence values for NaN/None
    for i, c in enumerate(hallucination_confidences):
        if c is None or (isinstance(c, float) and (c != c)):  # NaN check
            raise ValueError(f"hallucination_confidences[{i}] is None or NaN. All confidences must be valid floats in [0,1].")
        _validate_confidence(c)

    H_eff = effective_hallucination_count(hallucination_confidences, params)
    norm_cost = (H_eff / N) + cost_ratio_refusal_to_halluc * (unjustified_refusals / N)
    if norm_cost >= 1.0:
        return 0.0
    return 1.0 - norm_cost
