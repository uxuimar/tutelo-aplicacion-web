-- Tabla catálogo de características
CREATE TABLE IF NOT EXISTS characteristics (
                                               id BIGINT PRIMARY KEY AUTO_INCREMENT,
                                               name VARCHAR(120) NOT NULL,
    icon VARCHAR(120),
    type VARCHAR(20) NOT NULL,
    CONSTRAINT uk_characteristics_name UNIQUE (name)
    );

-- Relación hotel <-> característica con valor boolean/numérico
CREATE TABLE IF NOT EXISTS hotel_characteristics (
                                                     id BIGINT PRIMARY KEY AUTO_INCREMENT,
                                                     hotel_id BIGINT NOT NULL,
                                                     characteristic_id BIGINT NOT NULL,
                                                     bool_value BOOLEAN,
                                                     num_value INT,

                                                     CONSTRAINT uk_hotel_characteristics_hotel_characteristic UNIQUE (hotel_id, characteristic_id),
    CONSTRAINT fk_hotel_characteristics_hotel FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    CONSTRAINT fk_hotel_characteristics_characteristic FOREIGN KEY (characteristic_id) REFERENCES characteristics(id) ON DELETE CASCADE
    );