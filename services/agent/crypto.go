package main

import (
	"crypto"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/pem"
	"errors"
	"log"
	"os"
)

var rsaPublicKey *rsa.PublicKey

func InitAgentRSA() {
	keyBytes, err := os.ReadFile("rsa_public.pem")
	if err != nil {
		log.Fatalf("Loi: Khong the doc file rsa_public.pem: %v", err)
	}

	block, _ := pem.Decode(keyBytes)
	if block == nil {
		log.Fatal("Loi: Sai dinh dang file rsa_public.pem")
	}

	pub, err := x509.ParsePKIXPublicKey(block.Bytes)
	if err != nil {
		log.Fatalf("Loi parse rsa public key: %v", err)
	}

	var ok bool
	rsaPublicKey, ok = pub.(*rsa.PublicKey)
	if !ok {
		log.Fatal("Key khong phai kieu rsa.PublicKey")
	}
	log.Println("Khoi tao engine RSA xac thuc tren Agent thanh cong")
}

// VerifySignature kiem tra tinh hop le cua chu ky so tu Server gui xuong
func VerifySignature(payload, signatureBase64 string) error {
	sigBytes, err := base64.StdEncoding.DecodeString(signatureBase64)
	if err != nil {
		return err
	}

	hashed := sha256.Sum256([]byte(payload))
	err = rsa.VerifyPKCS1v15(rsaPublicKey, crypto.SHA256, hashed[:], sigBytes)
	if err != nil {
		return errors.New("chu ky so khong hop le - tu choi thuc thi")
	}
	return nil
}
