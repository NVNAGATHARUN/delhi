"""
Generate a synthetic traffic video for testing the vehicle tracker.
Creates colored rectangles (cars, trucks, buses) moving across the frame,
simulating a top-down intersection view.
"""
import cv2
import numpy as np
import random
import os

W, H = 640, 480
FPS = 25
DURATION = 12  # seconds
TOTAL_FRAMES = FPS * DURATION
OUT = os.path.join(os.path.dirname(__file__), "..", "..", "..", "frontend", "public", "samples", "sample_traffic.mp4")

# Vehicle templates: (width, height, color_bgr, label)
TEMPLATES = [
    (40, 22, (246, 130, 59), "car"),      # blue
    (40, 22, (59, 200, 130), "car"),      # green-ish
    (55, 28, (11, 158, 245), "bus"),      # amber
    (50, 26, (68, 68, 239), "truck"),     # red
    (35, 18, (247, 85, 168), "moto"),     # purple
]

class FakeVehicle:
    def __init__(self):
        self.template = random.choice(TEMPLATES)
        self.w, self.h, self.color, self.label = self.template
        # Pick a direction: 0=down, 1=up, 2=right, 3=left
        self.direction = random.randint(0, 3)
        self.speed = random.uniform(2.5, 5.5)
        if self.direction == 0:    # top to bottom
            self.x = random.randint(50, W//2 - 60)
            self.y = -self.h
        elif self.direction == 1:  # bottom to top
            self.x = random.randint(W//2 + 10, W - 60)
            self.y = H + self.h
        elif self.direction == 2:  # left to right
            self.x = -self.w
            self.y = random.randint(50, H//2 - 40)
            self.w, self.h = self.h, self.w  # rotate
        else:                      # right to left
            self.x = W + self.w
            self.y = random.randint(H//2 + 10, H - 40)
            self.w, self.h = self.h, self.w  # rotate

    def update(self):
        if self.direction == 0:   self.y += self.speed
        elif self.direction == 1: self.y -= self.speed
        elif self.direction == 2: self.x += self.speed
        else:                     self.x -= self.speed

    def alive(self):
        return -80 < self.x < W + 80 and -80 < self.y < H + 80

    def draw(self, frame):
        x1, y1 = int(self.x), int(self.y)
        x2, y2 = x1 + self.w, y1 + self.h
        cv2.rectangle(frame, (x1, y1), (x2, y2), self.color, -1)
        cv2.rectangle(frame, (x1, y1), (x2, y2), (40, 40, 40), 1)
        # Headlights
        if self.direction == 0:
            cv2.circle(frame, (x1 + 5, y1 + self.h), 2, (200, 255, 255), -1)
            cv2.circle(frame, (x2 - 5, y1 + self.h), 2, (200, 255, 255), -1)


def generate():
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(OUT, fourcc, FPS, (W, H))

    vehicles = []

    for f in range(TOTAL_FRAMES):
        # Dark road background
        frame = np.full((H, W, 3), (30, 30, 35), dtype=np.uint8)

        # Road markings — vertical road
        cv2.rectangle(frame, (40, 0), (W//2 - 5, H), (45, 45, 50), -1)
        cv2.rectangle(frame, (W//2 + 5, 0), (W - 40, H), (45, 45, 50), -1)
        # Horizontal road
        cv2.rectangle(frame, (0, 40), (W, H//2 - 5), (45, 45, 50), -1)
        cv2.rectangle(frame, (0, H//2 + 5), (W, H - 40), (45, 45, 50), -1)

        # Center dashes
        for y in range(0, H, 30):
            cv2.line(frame, (W//2, y), (W//2, y + 15), (80, 80, 60), 1)
        for x in range(0, W, 30):
            cv2.line(frame, (x, H//2), (x + 15, H//2), (80, 80, 60), 1)

        # Counting line
        line_y = int(H * 0.6)
        cv2.line(frame, (0, line_y), (W, line_y), (0, 0, 200), 2)
        cv2.putText(frame, "COUNTING LINE", (8, line_y - 6),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.35, (0, 0, 200), 1)

        # Spawn new vehicles 
        if random.random() < 0.12:  # ~3 per second
            vehicles.append(FakeVehicle())

        # Update and draw
        for v in vehicles:
            v.update()
            v.draw(frame)

        vehicles = [v for v in vehicles if v.alive()]

        # Frame counter
        cv2.putText(frame, f"Frame {f}/{TOTAL_FRAMES}", (W - 140, 16),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.35, (120, 120, 120), 1)

        writer.write(frame)

    writer.release()
    print(f"Wrote {TOTAL_FRAMES} frames to {OUT}")


if __name__ == "__main__":
    generate()
