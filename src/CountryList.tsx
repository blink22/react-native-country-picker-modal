import React, { useRef, memo, useState, useEffect } from 'react'
import {
  StyleSheet,
  View,
  FlatList,
  ScrollView,
  TouchableOpacity,
  Text,
  ListRenderItemInfo,
  PixelRatio,
  FlatListProps
} from 'react-native'
import { useTheme } from './CountryTheme'
import { Country, Omit } from './types'
import { Flag } from './Flag'
import { useContext } from './CountryContext'

const borderBottomWidth = 2 / PixelRatio.get()

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'white'
  },
  letters: {
    marginRight: 10,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center'
  },
  letter: {
    height: 23,
    width: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  letterText: {
    textAlign: 'center'
  },
  itemCountry: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 5
  },
  itemCountryName: {
    width: '90%'
  },
  list: {
    flex: 1
  },
  sep: {
    borderBottomWidth,
    width: '100%'
  }
})

interface LetterProps {
  letter: string
  scrollTo(letter: string): void
}
const Letter = ({ letter, scrollTo }: LetterProps) => {
  const { fontFamily, fontSize, activeOpacity } = useTheme()
  return (
    <TouchableOpacity
      testID={`letter-${letter}`}
      key={letter}
      onPress={() => scrollTo(letter)}
      {...{ activeOpacity }}
    >
      <View style={styles.letter}>
        <Text
          style={[styles.letterText, { fontFamily, fontSize: fontSize! * 0.8 }]}
          allowFontScaling={false}
        >
          {letter}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

interface CountryItemProps {
  country: Country
  withFlag?: boolean
  withEmoji?: boolean
  withCallingCode?: boolean
  withCurrency?: boolean
  onSelect(country: Country): void
}
const CountryItem = (props: CountryItemProps) => {
  const { activeOpacity, fontSize, fontFamily, itemHeight } = useTheme()
  const {
    country,
    onSelect,
    withFlag,
    withEmoji,
    withCallingCode,
    withCurrency
  } = props
  const extraContent: string[] = []
  if (
    withCallingCode &&
    country.callingCode &&
    country.callingCode.length > 0
  ) {
    extraContent.push(`+${country.callingCode.join('|')}`)
  }
  if (withCurrency && country.currency && country.currency.length > 0) {
    extraContent.push(country.currency.join('|'))
  }
  return (
    <TouchableOpacity
      key={country.cca2}
      testID={`country-selector-${country.cca2}`}
      onPress={() => onSelect(country)}
      {...{ activeOpacity }}
    >
      <View style={[styles.itemCountry, { height: itemHeight }]}>
        {withFlag && <Flag {...{ withEmoji, countryCode: country.cca2 }} />}
        <View style={styles.itemCountryName}>
          <Text
            style={{ fontFamily, fontSize }}
            allowFontScaling={false}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {country.name}
            {extraContent.length > 0 && ` (${extraContent.join(', ')})`}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}
CountryItem.defaultProps = {
  withFlag: true,
  withCallingCode: false
}
const MemoCountryItem = memo<CountryItemProps>(CountryItem)

const renderItem = (props: Omit<CountryItemProps, 'country'>) => ({
  item: country
}: ListRenderItemInfo<Country>) => (
  <MemoCountryItem {...{ country, ...props }} />
)

interface CountryListProps {
  data: Country[]
  filter?: string
  filterFocus?: boolean
  withFlag?: boolean
  withEmoji?: boolean
  withAlphaFilter?: boolean
  withCallingCode?: boolean
  withCurrency?: boolean
  flatListProps?: FlatListProps<Country>
  onSelect(country: Country): void
}

const keyExtractor = (item: Country) => item.cca2

const ItemSeparatorComponent = () => {
  const { primaryColor } = useTheme()
  return <View style={[styles.sep, { borderBottomColor: primaryColor }]} />
}

export const CountryList = (props: CountryListProps) => {
  const {
    data,
    withAlphaFilter,
    withEmoji,
    withFlag,
    withCallingCode,
    withCurrency,
    onSelect,
    filter,
    flatListProps,
    filterFocus
  } = props
  const flatListRef = useRef<FlatList<Country>>(null)
  const [letter, setLetter] = useState<string>('')
  const { itemHeight } = useTheme()
  const indexLetter = data
    .map((country: Country) => (country.name as string).substr(0, 1))
    .join('')

  const scrollTo = (letter: string) => {
    const index = indexLetter.indexOf(letter)
    setLetter(letter)
    if (flatListRef.current) {
      flatListRef.current!.scrollToIndex({ animated: true, index })
    }
  }
  const onScrollToIndexFailed = (_info: {
    index: number
    highestMeasuredFrameIndex: number
    averageItemLength: number
  }) => {
    if (flatListRef.current) {
      flatListRef.current!.scrollToEnd()
      scrollTo(letter)
    }
  }
  useEffect(() => {
    if (data && data.length > 0) {
      scrollTo('A')
    }
  }, [filterFocus])
  const { search, getLetters } = useContext()
  return (
    <View style={styles.container}>
      <FlatList
        onScrollToIndexFailed
        ref={flatListRef}
        testID="list-countries"
        keyboardShouldPersistTaps="handled"
        initialNumToRender={12}
        automaticallyAdjustContentInsets={false}
        scrollEventThrottle={1}
        getItemLayout={(_data: any, index) => ({
          length: itemHeight! + borderBottomWidth,
          offset: (itemHeight! + borderBottomWidth) * index,
          index
        })}
        renderItem={renderItem({
          withEmoji,
          withFlag,
          withCallingCode,
          withCurrency,
          onSelect
        })}
        {...{
          data: search(filter, data),
          keyExtractor,
          onScrollToIndexFailed,
          ItemSeparatorComponent
        }}
        {...flatListProps}
      />
      {withAlphaFilter && (
        <ScrollView
          contentContainerStyle={styles.letters}
          keyboardShouldPersistTaps="always"
        >
          {getLetters().map(letter => (
            <Letter key={letter} {...{ letter, scrollTo }} />
          ))}
        </ScrollView>
      )}
    </View>
  )
}