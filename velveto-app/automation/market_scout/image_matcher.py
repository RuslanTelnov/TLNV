import imagehash
from PIL import Image
import requests
from io import BytesIO
import os

class ImageMatcher:
    def __init__(self):
        pass

    def load_image_from_url(self, url):
        """Downloads image from URL and returns PIL Image object."""
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            return Image.open(BytesIO(response.content))
        except Exception as e:
            print(f"Error loading image from {url}: {e}")
            return None

    def load_image_from_path(self, path):
        """Loads image from local path."""
        try:
            return Image.open(path)
        except Exception as e:
            print(f"Error loading image from {path}: {e}")
            return None

    def calculate_hash(self, image):
        """Calculates perceptual hash of an image."""
        if image is None:
            return None
        return imagehash.average_hash(image)

    def compare_images(self, img1, img2):
        """
        Compares two images and returns a similarity score (0.0 to 1.0).
        1.0 means identical.
        """
        hash1 = self.calculate_hash(img1)
        hash2 = self.calculate_hash(img2)

        if hash1 is None or hash2 is None:
            return 0.0

        # Hamming distance: 0 means identical.
        # Max distance for 64-bit hash is 64.
        distance = hash1 - hash2
        
        # Normalize to 0-1 score
        # If distance is 0, score is 1.0
        # If distance is > 20, score is basically 0 (very different)
        score = max(0.0, 1.0 - (distance / 20.0))
        return score

    def compare_url_and_path(self, url, path):
        """Helper to compare a remote URL image with a local file."""
        img1 = self.load_image_from_url(url)
        img2 = self.load_image_from_path(path)
        return self.compare_images(img1, img2)
