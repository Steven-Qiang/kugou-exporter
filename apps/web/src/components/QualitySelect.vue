<template>
  <el-select v-model="quality" :size="size" placeholder="请选择音质">
    <el-option label="钢琴" value="piano" />
    <el-option label="清唱" value="acappella" />
    <el-option label="低音炮" value="subwoofer" />
    <el-option label="古风" value="ancient" />
    <el-option label="唤呐" value="surnay" />
    <el-option label="DJ" value="dj" />
    <el-option label="128K" value="128" />
    <el-option label="320K" value="320" />
    <el-option label="无损 (FLAC)" value="flac" />
    <el-option label="高品质 (HiRes)" value="high" />
    <el-option label="Viper Atmos" value="viper_atmos" />
    <el-option label="Viper Clear" value="viper_clear" />
    <el-option label="Viper Tape" value="viper_tape" />
  </el-select>
</template>

<script setup lang="ts">
defineProps<{ size?: 'large' | 'default' | 'small' }>();
const quality = defineModel<string>({ required: true });
</script>
