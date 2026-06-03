export type Complex = {
  re: number;
  im: number;
};

export function complex(re: number, im = 0): Complex {
  return { re, im };
}

export function cadd(a: Complex, b: Complex): Complex {
  return { re: a.re + b.re, im: a.im + b.im };
}

export function csub(a: Complex, b: Complex): Complex {
  return { re: a.re - b.re, im: a.im - b.im };
}

export function cmul(a: Complex, b: Complex): Complex {
  return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re };
}

export function cdiv(a: Complex, b: Complex): Complex {
  const denominator = b.re * b.re + b.im * b.im;
  if (denominator === 0) throw new Error("complex division by zero");
  return {
    re: (a.re * b.re + a.im * b.im) / denominator,
    im: (a.im * b.re - a.re * b.im) / denominator
  };
}

export function cscale(a: Complex, scale: number): Complex {
  return { re: a.re * scale, im: a.im * scale };
}

export function cneg(a: Complex): Complex {
  return { re: -a.re, im: -a.im };
}

export function cinv(a: Complex): Complex {
  return cdiv(complex(1), a);
}

export function cabs2(a: Complex): number {
  return a.re * a.re + a.im * a.im;
}

export function cabs(a: Complex): number {
  return Math.hypot(a.re, a.im);
}

export function csqrt(a: Complex): Complex {
  if (a.im === 0 && a.re >= 0) return complex(Math.sqrt(a.re));
  const magnitude = cabs(a);
  const re = Math.sqrt(Math.max(0, (magnitude + a.re) / 2));
  const im = Math.sign(a.im || 1) * Math.sqrt(Math.max(0, (magnitude - a.re) / 2));
  return { re, im };
}

export function csin(a: Complex): Complex {
  return {
    re: Math.sin(a.re) * Math.cosh(a.im),
    im: Math.cos(a.re) * Math.sinh(a.im)
  };
}

export function ccos(a: Complex): Complex {
  return {
    re: Math.cos(a.re) * Math.cosh(a.im),
    im: -Math.sin(a.re) * Math.sinh(a.im)
  };
}

export function cis(theta: number): Complex {
  return { re: Math.cos(theta), im: Math.sin(theta) };
}

export function cfinite(a: Complex): boolean {
  return Number.isFinite(a.re) && Number.isFinite(a.im);
}

export function cround(a: Complex, digits = 12): Complex {
  const scale = 10 ** digits;
  return {
    re: Math.round(a.re * scale) / scale,
    im: Math.round(a.im * scale) / scale
  };
}
