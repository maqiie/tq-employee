import React from 'react'
import { View, Text, Platform } from 'react-native'
import { NavigationScreenComponent } from 'react-navigation'
import { BottomTabBarOptions } from 'react-navigation-tabs/lib/typescript/src/types'
import { createMaterialBottomTabNavigator } from 'react-navigation-material-bottom-tabs'
import Icon from 'react-native-vector-icons/MaterialIcons'

import {
	NavigationRoute,
	CreateNavigatorConfig,
	NavigationTabRouterConfig,
	NavigationRouteConfigMap,
	NavigationParams
} from 'react-navigation'

import {
	createBottomTabNavigator,
	NavigationTabProp,
	NavigationBottomTabOptions
} from 'react-navigation-tabs'

type Config = {
	lazy?: boolean
	tabBarComponent?: React.ComponentType<any>
	tabBarOptions?: BottomTabBarOptions
}

type RouteConfigMap = NavigationRouteConfigMap<
	NavigationBottomTabOptions,
	NavigationTabProp<NavigationRoute<NavigationParams>, any>
>

type NavigatorConfig = CreateNavigatorConfig<
	Partial<Config>,
	NavigationTabRouterConfig,
	Partial<NavigationBottomTabOptions>,
	NavigationTabProp<NavigationRoute<NavigationParams>, any>
>

type TabIconProps = {
	badgeCount?: number
	name?: string
}

type IconProps = {
	tintColor: string
}

function tabIcon(props: TabIconProps) {
	const { badgeCount, name, ...rest } = props
	if (name) {
		return ({ tintColor }: IconProps) => (
			<View style={{ width: 24, height: 24, margin: !!badgeCount ? 5 : 0 }}>
				<Icon
					{...rest}
					name={name}
					style={{ color: tintColor, fontSize: 24, textAlign: 'center' }}
				/>
				{!!badgeCount && (
					<View
						style={{
							position: 'absolute',
							right: -6,
							top: -3,
							backgroundColor: 'red',
							borderRadius: 9,
							width: 18,
							height: 18,
							justifyContent: 'center',
							alignItems: 'center'
						}}
					>
						<Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
							{badgeCount}
						</Text>
					</View>
				)}
			</View>
		)
	}
	return null
}

type BottomTabScreens = {
	[key: string]: BottomTabScreen
}

type SecondArgument<T> = T extends (
	arg1: any,
	arg2: infer U,
	...args: any[]
) => any
	? U
	: any

type BottomTabScreen = {
	screen: NavigationScreenComponent<any, any>
	icon?: string
	title?: string
}

export function createBottomTab(
	screens: BottomTabScreens,
	navigatorConfig?: NavigatorConfig &
		SecondArgument<typeof createMaterialBottomTabNavigator>
) {
	const routeConfig: RouteConfigMap = {}

	for (const [key, value] of Object.entries(screens)) {
		const { screen, icon, title } = value
		routeConfig[key] = {
			screen: screen,
			navigationOptions: {
				title,
				tabBarIcon: tabIcon({ name: icon })
			}
		}
	}
	if (Platform.OS === 'ios') {
		return createBottomTabNavigator(routeConfig, navigatorConfig)
	} else {
		return createMaterialBottomTabNavigator(routeConfig, navigatorConfig)
	}
}
