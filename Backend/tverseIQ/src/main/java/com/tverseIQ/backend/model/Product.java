package com.tverseIQ.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name="product")
@Getter
@Setter
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long productId;

    @Column(nullable=false, unique = true,length=64)
    private String sku;

    @Column(nullable = false)
    private String name;

    @Column(length = 100)
    private String category;

}
