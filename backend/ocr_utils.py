import pytesseract
import cv2
import numpy as np
from PIL import Image
from pdf2image import convert_from_path

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"


def image_to_text(image_path):
    img = cv2.imread(image_path)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    thresh = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)[1]

    text = pytesseract.image_to_string(thresh)

    return text


def pdf_to_text(pdf_path):

    pages = convert_from_path(pdf_path)

    full_text = ""

    for page in pages:
        img = np.array(page)
        text = pytesseract.image_to_string(img)
        full_text += text

    return full_text