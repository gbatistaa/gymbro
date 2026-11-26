package com.gbatistadev.gymbro.common.storage;

/**
 * Armazenamento de arquivos fora do banco. Chaves nunca são reaproveitadas: trocar um arquivo é
 * gravar uma chave nova e apagar a antiga, então o conteúdo de uma chave é imutável.
 */
public interface ObjectStorage {

    void put(String key, byte[] content, String contentType);

    void delete(String key);

    /** Link de leitura temporário; o bucket é privado. */
    String readUrl(String key);
}
