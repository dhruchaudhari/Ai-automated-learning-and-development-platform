# utils/math_utils.py

def clamp(value, min_val, max_val):
    return max(float(min_val), min(float(value), float(max_val)))

def stability_curve(x):
    x_val = float(x)
    return x_val / (1.0 + abs(x_val))

def risk_limiter(x):
    x_val = float(x)
    return (x_val * x_val) / (1.0 + x_val * x_val)