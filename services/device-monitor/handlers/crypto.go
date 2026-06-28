package handlers

import (
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/pem"
	"log"
	"os"
)

var privateKey *rsa.PrivateKey

func InitRSA() {
	keyBytes, err := os.ReadFile("rsa_private.pem")
	if err != nil {
		log.Fatalf("Khong the doc file rsa_private.pem: %v", err)
	}

	block, _ := pem.Decode(keyBytes)
	if block == nil {
		log.Fatal("Sai dinh dang file rsa_private.pem")
	}

	privateKey, err = x509.ParsePKCS1PrivateKey(block.Bytes)
	if err != nil {
		// Fallback PKCS8 format
		parsedKey, err8 := x509.ParsePKCS8PrivateKey(block.Bytes)
		if err8 != nil {
			log.Fatalf("Loi parse rsa private key: %v (PKCS1 err: %v)", err8, err)
		}
		var ok bool
		privateKey, ok = parsedKey.(*rsa.PrivateKey)
		if !ok {
			log.Fatal("Key khong phai kieu rsa.PrivateKey")
		}
	}
	log.Println("Khoi tao engine RSA thanh cong")
}

// SignData ky so du lieu bang RSA Private Key
func SignData(data string) (string, error) {
	hashed := sha256.Sum256([]byte(data))
	signature, err := rsa.SignPKCS1v15(rand.Reader, privateKey, crypto.SHA256, hashed[:])
	if err != nil {
		return "", err
	}
	return base64.StdEncoding.EncodeToString(signature), nil
}
