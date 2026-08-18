package com.tverseIQ.backend.repository;

import com.tverseIQ.backend.model.ChannelSkuMap;
import com.tverseIQ.backend.model.Platform;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Repository
public interface ChannelSkuMapRepository extends JpaRepository<ChannelSkuMap,Long> {

    Optional<ChannelSkuMap> findByChannelProductIdAndPlatform(String channelProductId, Platform platform);

    List<ChannelSkuMap> findByPlatform(Platform platform);
}
